#!/usr/bin/env node
// Verifies the markdown export in the build output. Run after `npm run build`:
//
//   node util/verify_markdown_export.js
//
// Checks:
//   1. Every page in the plugin's manifest has a non-empty .md, and every
//      sitemap route is a doc page, a stub, or a known non-doc route.
//   2. No generated .md contains import lines, JSX residue, or snipsync
//      markers (outside code fences), and every page file starts with an H1
//      followed by its exact canonical URL.
//   3. Every internal .md link in every generated file resolves to an
//      emitted file (in-page links, llms.txt, and both llms-full.txt files).
//   4. The llms selection is current-stable-only, and the framework and
//      Cloud sections are each non-empty.
//   5. Every source path in redirects.js has either a real page .md or a
//      "moved to" stub.
//   6. Sampled pages from each instance render the button and the
//      text/markdown alternate link tag.
//
// Exits non-zero with a list of failures.

const fs = require('fs');
const path = require('path');

const {
  SITE_URL,
  mdFilePath,
  normalizePermalink,
} = require('../plugins/markdown-export/urls');
const redirects = require('../redirects');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const MANIFEST = path.join(ROOT, '.docusaurus', 'markdown-export-manifest.json');

// Sitemap routes that are not doc pages and have no markdown by design.
const NON_DOC_ROUTES = new Set(['/search']);

// Version-prefixed route (first path segment is `next` or a version number).
const VERSIONED_ROUTE_RE = /^\/(next|\d+\.\d+\.\d+)([/.]|$)/;

const failures = [];
function fail(message) {
  failures.push(message);
}

/** Does an emitted .md file exist for this site-absolute .md URL? */
function mdUrlResolves(url) {
  const rel = url.replace(SITE_URL, '').replace(/^\//, '');
  return rel !== '.md' && rel !== '' && fs.existsSync(path.join(BUILD, rel));
}

function stripCode(markdown) {
  return markdown
    .replace(/^ {0,3}(```|~~~)[\s\S]*?^ {0,3}\1[^\n]*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

// 1. Every manifest page has a non-empty .md, and every sitemap route is
// accounted for (a doc page, a stub, or a known non-doc route), so a
// silently skipped doc tree cannot pass.
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  : null;
if (!manifest) {
  fail(`missing ${MANIFEST}; run npm run build first`);
} else {
  for (const page of manifest.pages) {
    const mdFile = path.join(BUILD, mdFilePath(page));
    if (!fs.existsSync(mdFile)) {
      fail(`missing .md for page ${page}`);
    } else if (fs.statSync(mdFile).size === 0) {
      fail(`empty .md for page ${page}`);
    }
  }
  const covered = new Set([...manifest.pages, ...manifest.stubs]);
  const sitemapPath = path.join(BUILD, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    fail('build/sitemap.xml is missing; run npm run build first');
  } else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].replace(SITE_URL, ''))
      .map((r) => normalizePermalink(r === '' ? '/' : r) || '/');
    for (const route of routes) {
      if (!covered.has(route) && !NON_DOC_ROUTES.has(route)) {
        fail(`sitemap route ${route} has no markdown export and is not a known non-doc route`);
      }
    }
    console.log(`manifest pages with .md: ${manifest.pages.length}, sitemap routes covered: ${routes.length}`);
  }
}

// 2 + 3 (in-page part). Content and link checks on every generated .md.
function* mdFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* mdFiles(full);
    } else if (entry.name.endsWith('.md')) {
      yield full;
    }
  }
}

const SITE_URL_RE = SITE_URL.replace(/[.\\/]/g, '\\$&');
const MD_LINK_RE = new RegExp(`\\((${SITE_URL_RE}[^)#\\s]*\\.md)(?:#[^)]*)?\\)`, 'g');
const CANONICAL_LINE_RE = new RegExp(`^${SITE_URL_RE}(\\/[\\w\\-./]*)?$`, 'gm');

let checked = 0;
let totalBytes = 0;
let inPageLinks = 0;
let brokenInPageLinks = 0;
for (const file of mdFiles(BUILD)) {
  const rel = path.relative(BUILD, file);
  const content = fs.readFileSync(file, 'utf8');
  totalBytes += content.length;
  checked += 1;

  if (/^Moved to https:\/\/[^\s]+\.md$/m.test(content.trim())) {
    continue; // redirect stub; single line by design
  }

  const prose = stripCode(content);
  if (/^import\s.+\sfrom\s/m.test(prose)) {
    fail(`${rel}: import residue`);
  }
  if (/<[A-Z][A-Za-z]*[\s/>]/.test(prose)) {
    fail(`${rel}: JSX residue`);
  }
  if (/SNIPSTART|SNIPEND/.test(content)) {
    fail(`${rel}: snipsync marker residue`);
  }

  const lines = content.split('\n');
  if (!lines[0].startsWith('# ')) {
    fail(`${rel}: does not start with an H1`);
  }
  const route = `/${rel.replace(/\.md$/, '')}`;
  const expectedCanonical = rel === 'index.md' ? SITE_URL : `${SITE_URL}${route}`;
  if ((lines[2] || '') !== expectedCanonical) {
    fail(`${rel}: canonical URL line is "${lines[2]}", expected "${expectedCanonical}"`);
  }

  for (const match of prose.matchAll(MD_LINK_RE)) {
    inPageLinks += 1;
    if (!mdUrlResolves(match[1])) {
      brokenInPageLinks += 1;
      if (brokenInPageLinks <= 10) {
        fail(`${rel}: broken internal link ${match[1]}`);
      }
    }
  }
}
if (brokenInPageLinks > 10) {
  fail(`...and ${brokenInPageLinks - 10} more broken internal links`);
}
console.log(
  `.md files checked: ${checked} (${(totalBytes / 1024 / 1024).toFixed(1)} MB), ` +
    `internal links resolved: ${inPageLinks - brokenInPageLinks}/${inPageLinks}`
);

// 3 (llms part) + 4. llms files: links resolve, the selection is stable-only
// (checked on llms.txt links and on llms-full canonical lines, which state
// each embedded page's identity; embedded page BODIES may legitimately link
// to versioned pages, e.g. from upgrade guides), and the framework and Cloud
// selections are each non-empty.
for (const llmsFile of ['llms.txt', 'llms-full.txt', path.join('cloud', 'llms-full.txt')]) {
  const fullPath = path.join(BUILD, llmsFile);
  if (!fs.existsSync(fullPath)) {
    fail(`missing ${llmsFile}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const links = [...content.matchAll(MD_LINK_RE)].map((m) => m[1]);
  // Only lines that are exactly a page URL count as canonical lines; prose
  // can contain a bare URL followed by punctuation.
  const canonicals = [...content.matchAll(CANONICAL_LINE_RE)].map((m) => m[1] || '/');
  if (links.length + canonicals.length === 0) {
    fail(`${llmsFile}: contains no links (empty generation would pass silently)`);
  }
  for (const link of links) {
    if (!mdUrlResolves(link)) {
      fail(`${llmsFile} links to missing file: ${link}`);
    }
  }
  for (const route of canonicals) {
    if (!fs.existsSync(path.join(BUILD, mdFilePath(route)))) {
      fail(`${llmsFile} canonical line has no emitted file: ${route}`);
    }
  }
  const identity =
    llmsFile === 'llms.txt'
      ? links.map((l) => l.replace(SITE_URL, '').replace(/\.md$/, ''))
      : canonicals;
  for (const route of identity.filter((r) => VERSIONED_ROUTE_RE.test(r)).slice(0, 5)) {
    fail(`${llmsFile} selects a page outside current stable: ${route}`);
  }
  console.log(`${llmsFile}: ${links.length} links + ${canonicals.length} canonical lines resolved`);
}
const llmsIndexPath = path.join(BUILD, 'llms.txt');
if (fs.existsSync(llmsIndexPath)) {
  const llmsLinks = [...fs.readFileSync(llmsIndexPath, 'utf8').matchAll(MD_LINK_RE)].map(
    (m) => m[1]
  );
  const isCloudLink = (l) =>
    l.startsWith(`${SITE_URL}/cloud/`) || l === `${SITE_URL}/cloud.md`;
  const cloudCount = llmsLinks.filter(isCloudLink).length;
  const frameworkCount = llmsLinks.length - cloudCount;
  if (frameworkCount === 0) {
    fail('llms.txt: framework section is empty');
  }
  if (cloudCount === 0) {
    fail('llms.txt: Cloud section is empty');
  }
  console.log(`llms.txt sections: framework ${frameworkCount}, cloud ${cloudCount}`);
}

// 5. Redirect coverage against redirects.js (the same module the site config
// consumes), independent of the plugin's own stub generation.
const fromPaths = redirects.flatMap((rule) =>
  Array.isArray(rule.from) ? rule.from : [rule.from]
);
if (fromPaths.length === 0) {
  fail('redirects.js contains no redirect sources');
}
for (const from of fromPaths) {
  const target = path.join(BUILD, mdFilePath(from.replace(/\/$/, '') || '/'));
  if (!fs.existsSync(target)) {
    fail(`redirect source ${from} has neither a page .md nor a moved-to stub`);
  }
}
if (manifest) {
  for (const stub of manifest.stubs) {
    const stubFile = path.join(BUILD, mdFilePath(stub));
    const stubContent = fs.readFileSync(stubFile, 'utf8').trim();
    if (!/^Moved to https:\/\/[^\s]+\.md$/.test(stubContent)) {
      fail(`redirect stub ${stub}.md has unexpected content`);
    } else if (!mdUrlResolves(stubContent.replace('Moved to ', ''))) {
      fail(`redirect stub ${stub}.md points at a missing file`);
    }
  }
  console.log(`redirect sources checked: ${fromPaths.length} (${manifest.stubs.length} stubs)`);
}

// 6. Sampled rendered pages (one per instance class, picked from the
// manifest) carry the alternate link tag and the copy button.
if (manifest) {
  const samples = [
    manifest.pages.find(
      (p) => p !== '/' && !p.startsWith('/cloud') && !VERSIONED_ROUTE_RE.test(p)
    ),
    manifest.pages.find((p) => p.startsWith('/cloud/')),
    manifest.pages.find((p) => VERSIONED_ROUTE_RE.test(p)),
  ].filter(Boolean);
  if (samples.length < 3) {
    fail('manifest is missing pages for one of: stable, cloud, versioned');
  }
  for (const permalink of samples) {
    const htmlFile = path.join(BUILD, `${permalink.replace(/^\//, '')}.html`);
    if (!fs.existsSync(htmlFile)) {
      fail(`sample page ${permalink} has no rendered HTML at ${htmlFile}`);
      continue;
    }
    const html = fs.readFileSync(htmlFile, 'utf8');
    if (!html.includes('rel="alternate" type="text/markdown"')) {
      fail(`${permalink}: rendered page is missing the text/markdown alternate link tag`);
    }
    if (!html.includes('Copy as Markdown')) {
      fail(`${permalink}: rendered page is missing the copy button`);
    }
  }
}

if (failures.length > 0) {
  console.error(`\nFAILED: ${failures.length} problem(s)`);
  for (const failure of failures.slice(0, 50)) {
    console.error(`  - ${failure}`);
  }
  if (failures.length > 50) {
    console.error(`  ... and ${failures.length - 50} more`);
  }
  process.exit(1);
}
console.log('\nmarkdown export verification passed');
