#!/usr/bin/env node
// Verifies the generated Open Graph cards in a finished build: every head
// og:image resolves to a valid emitted 1200x630 card, docs pages are not
// silently uncovered, and no card is orphaned. Run after `npm run build`.

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sharp = require('sharp');

const {
  CARD_HEIGHT,
  CARD_WIDTH,
  PUBLIC_PATH,
} = require('../plugins/open-graph-images/shared');
const { SITE_URL } = require('../plugins/markdown-export/urls');

const SITE_TITLE = 'Serverpod';
const CARD_FILE_PATTERN = /^[a-f0-9]{20}\.jpg$/;
const CARD_PATH_PATTERN = new RegExp(
  `^${PUBLIC_PATH.replace(/\//g, '\\/')}\\/([a-f0-9]{20}\\.jpg)$`
);

function headMetadata(html) {
  const $ = cheerio.load(html.replace(/^\uFEFF/, ''));
  const attributes = $('head meta')
    .toArray()
    .map((element) => element.attribs || {});
  const byProperty = (property) =>
    attributes
      .filter((a) => a.property === property)
      .map((a) => a.content ?? '');
  return {
    images: byProperty('og:image'),
    titles: byProperty('og:title'),
    isDocPage: attributes.some((a) => a.name === 'docusaurus_version'),
  };
}

function walkHtml(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtml(entryPath, onFile);
    } else if (entry.name.endsWith('.html')) {
      onFile(entryPath);
    }
  }
}

async function verifyBuild(buildDir) {
  const cardDir = path.join(buildDir, 'img', 'open-graph');
  const siteOrigin = new URL(SITE_URL).origin;
  const failures = [];
  const emitted = new Set(
    (fs.existsSync(cardDir) ? fs.readdirSync(cardDir) : []).filter((name) =>
      CARD_FILE_PATTERN.test(name)
    )
  );
  const referenced = new Set();
  let pagesWithCards = 0;

  walkHtml(buildDir, (filePath) => {
    const page = path.relative(buildDir, filePath);
    const { images, titles, isDocPage } = headMetadata(
      fs.readFileSync(filePath, 'utf8')
    );
    let hasCard = false;

    if (titles.length > 1) {
      failures.push(`${page} has ${titles.length} conflicting og:title tags`);
    }

    for (const value of images) {
      if (value.trim() === '') {
        failures.push(`${page} has a blank og:image`);
        continue;
      }
      let url;
      try {
        url = new URL(value, SITE_URL);
      } catch {
        failures.push(`${page} has an unparseable og:image URL: ${value}`);
        continue;
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        failures.push(`${page} has a non-HTTP og:image URL: ${value}`);
        continue;
      }
      const pathname = url.pathname.replace(/\/{2,}/g, '/');
      const inCardNamespace =
        pathname === PUBLIC_PATH || pathname.startsWith(`${PUBLIC_PATH}/`);
      const match = pathname.match(CARD_PATH_PATTERN);
      if (url.origin === siteOrigin && inCardNamespace && !match) {
        failures.push(`${page} has a malformed card path: ${value}`);
        continue;
      }
      if (!match) {
        continue;
      }
      if (url.origin !== siteOrigin) {
        failures.push(
          `${page} references a card on the wrong origin: ${value}`
        );
        continue;
      }
      hasCard = true;
      referenced.add(match[1]);
      if (!emitted.has(match[1])) {
        failures.push(`${page} references missing card ${match[1]}`);
      }
    }
    if (hasCard) {
      pagesWithCards += 1;
    }

    if (
      images.length === 0 &&
      page !== '404.html' &&
      isDocPage &&
      !(titles.length === 1 && titles[0] === SITE_TITLE)
    ) {
      failures.push(`docs page ${page} has no og:image`);
    }
  });

  if (pagesWithCards === 0) {
    failures.push('no page references a generated Open Graph card');
  }
  for (const fileName of emitted) {
    if (!referenced.has(fileName)) {
      failures.push(`orphaned card ${fileName} is referenced by no page`);
    }
  }

  for (const fileName of [...referenced].sort()) {
    if (!emitted.has(fileName)) {
      continue;
    }
    const cardPath = path.join(cardDir, fileName);
    try {
      const metadata = await sharp(cardPath).metadata();
      if (
        metadata.format !== 'jpeg' ||
        metadata.width !== CARD_WIDTH ||
        metadata.height !== CARD_HEIGHT
      ) {
        failures.push(
          `${fileName} is ${metadata.format} ${metadata.width}x${metadata.height}, ` +
            `expected jpeg ${CARD_WIDTH}x${CARD_HEIGHT}`
        );
        continue;
      }
      await sharp(cardPath).stats();
    } catch (error) {
      failures.push(`${fileName} failed to decode: ${error.message}`);
    }
  }

  return { failures, pagesWithCards, cardCount: referenced.size };
}

async function main() {
  const buildDir = path.join(__dirname, '..', 'build');
  const { failures, pagesWithCards, cardCount } = await verifyBuild(buildDir);
  if (failures.length > 0) {
    console.error(`Open Graph verification failed (${failures.length}):`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Open Graph verification passed: ${pagesWithCards} pages, ` +
      `${cardCount} cards.`
  );
}

module.exports = { verifyBuild };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
