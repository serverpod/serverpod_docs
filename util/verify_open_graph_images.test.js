const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const sharp = require('sharp');

const { verifyBuild } = require('./verify_open_graph_images');

const IDS = {
  valid: 'a'.repeat(20),
  reordered: 'b'.repeat(20),
  missing: 'c'.repeat(20),
  orphaned: 'd'.repeat(20),
  corrupt: 'e'.repeat(20),
  wrongSize: 'f'.repeat(20),
  decoy: '0'.repeat(20),
  wrongOrigin: '1'.repeat(20),
};

function page(fileName, head, body = '') {
  return [fileName, `<html><head>${head}</head><body>${body}</body></html>`];
}

function docHead(title, extra = '') {
  return (
    '<meta name="docusaurus_version" content="current">' +
    `<meta data-rh="true" property="og:title" content="${title}">` +
    extra
  );
}

function cardMeta(id, origin = 'https://docs.serverpod.dev') {
  return `<meta data-rh="true" property="og:image" content="${origin}/img/open-graph/${id}.jpg">`;
}

async function jpeg(width, height) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 9, g: 27, b: 79 } },
  })
    .jpeg()
    .toBuffer();
}

async function fixtureBuild(t, { pages, cards }) {
  const buildDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-verify-')
  );
  t.after(() => fs.rmSync(buildDir, { recursive: true, force: true }));
  const cardDir = path.join(buildDir, 'img', 'open-graph');
  fs.mkdirSync(path.join(buildDir, 'nested'), { recursive: true });
  fs.mkdirSync(cardDir, { recursive: true });
  for (const [fileName, html] of pages) {
    fs.writeFileSync(path.join(buildDir, fileName), html);
  }
  for (const [fileName, content] of Object.entries(cards)) {
    fs.writeFileSync(path.join(cardDir, fileName), content);
  }
  return buildDir;
}

test('a healthy build passes: explicit images, redirects, empty titles, 404, custom files', async (t) => {
  const card = await jpeg(1200, 630);
  const buildDir = await fixtureBuild(t, {
    pages: [
      page('a.html', docHead('A | Serverpod', cardMeta(IDS.valid))),
      page(
        path.join('nested', 'b.html'),
        docHead(
          'B | Serverpod',
          `<meta data-rh="true" content="https://docs.serverpod.dev/img/open-graph/${IDS.reordered}.jpg" property="og:image">`
        )
      ),
      page(
        'explicit.html',
        docHead(
          'Explicit | Serverpod',
          '<meta property="og:image" content="https://example.com/custom.png">'
        )
      ),
      page('empty-title.html', docHead('Serverpod')),
      page('404.html', docHead('Page Not Found | Serverpod')),
      page('redirect.html', '<meta http-equiv="refresh" content="0; url=/a">'),
    ],
    cards: {
      [`${IDS.valid}.jpg`]: card,
      [`${IDS.reordered}.jpg`]: card,
      'custom.jpg': 'not a card, deliberately preserved',
    },
  });

  const result = await verifyBuild(buildDir);
  assert.deepEqual(result.failures, []);
  assert.equal(result.pagesWithCards, 2);
  assert.equal(result.cardCount, 2);
});

test('false-pass paths and broken cards are each reported', async (t) => {
  const card = await jpeg(1200, 630);
  const truncated = card.subarray(0, 500);
  const truncatedMetadata = await sharp(truncated).metadata();
  assert.equal(truncatedMetadata.format, 'jpeg');
  assert.equal(truncatedMetadata.width, 1200);
  assert.equal(truncatedMetadata.height, 630);

  const buildDir = await fixtureBuild(t, {
    pages: [
      page('ok.html', docHead('Ok | Serverpod', cardMeta(IDS.valid))),
      page('missing.html', docHead('M | Serverpod', cardMeta(IDS.missing))),
      page('corrupt.html', docHead('C | Serverpod', cardMeta(IDS.corrupt))),
      page(
        'wrong-size.html',
        docHead('W | Serverpod', cardMeta(IDS.wrongSize))
      ),
      page(
        'decoy.html',
        docHead(
          'D | Serverpod',
          `<meta property="og:image" data-card="/img/open-graph/${IDS.decoy}.jpg" content="https://evil.example/not-the-card.png">`
        )
      ),
      page(
        'wrong-origin.html',
        docHead(
          'O | Serverpod',
          cardMeta(IDS.wrongOrigin, 'https://evil.example')
        )
      ),
    ],
    cards: {
      [`${IDS.valid}.jpg`]: card,
      [`${IDS.orphaned}.jpg`]: card,
      [`${IDS.decoy}.jpg`]: card,
      [`${IDS.corrupt}.jpg`]: truncated,
      [`${IDS.wrongSize}.jpg`]: await jpeg(800, 600),
    },
  });

  const { failures } = await verifyBuild(buildDir);
  assert.equal(failures.length, 6);
  assert.ok(
    failures.some((f) => f.includes(`missing card ${IDS.missing}.jpg`))
  );
  assert.ok(
    failures.some((f) => f.includes(`orphaned card ${IDS.orphaned}.jpg`))
  );
  assert.ok(failures.some((f) => f.includes(`orphaned card ${IDS.decoy}.jpg`)));
  assert.ok(
    failures.some((f) => f.includes(`${IDS.corrupt}.jpg failed to decode`))
  );
  assert.ok(
    failures.some(
      (f) => f.includes(`${IDS.wrongSize}.jpg`) && f.includes('800x600')
    )
  );
  assert.ok(
    failures.some(
      (f) =>
        f.includes('wrong-origin.html') &&
        f.includes('card on the wrong origin')
    )
  );
});

test('parser-level false passes are rejected', async (t) => {
  const card = await jpeg(1200, 630);
  const buildDir = await fixtureBuild(t, {
    pages: [
      page('ok.html', docHead('Ok | Serverpod', cardMeta(IDS.valid))),
      page(
        'fake-property.html',
        docHead(
          'F | Serverpod',
          `<meta data-property="og:image" content="https://docs.serverpod.dev/img/open-graph/${IDS.missing}.jpg">`
        )
      ),
      page('body-meta.html', docHead('B | Serverpod'), cardMeta(IDS.missing)),
      page(
        'commented.html',
        docHead('C | Serverpod', `<!-- ${cardMeta(IDS.missing)} -->`)
      ),
      page(
        'malformed.html',
        docHead(
          'M | Serverpod',
          '<meta property="og:image" content="https://docs.serverpod.dev/img/open-graph/not-a-card.jpg">'
        )
      ),
      page(
        'double-title.html',
        '<meta name="docusaurus_version" content="current">' +
          '<meta property="og:title" content="Serverpod">' +
          '<meta property="og:title" content="Real Page | Serverpod">' +
          cardMeta(IDS.valid)
      ),
    ],
    cards: { [`${IDS.valid}.jpg`]: card },
  });

  const { failures } = await verifyBuild(buildDir);
  assert.deepEqual(failures.sort(), [
    'docs page body-meta.html has no og:image',
    'docs page commented.html has no og:image',
    'docs page fake-property.html has no og:image',
    'double-title.html has 2 conflicting og:title tags',
    'malformed.html has a malformed card path: https://docs.serverpod.dev/img/open-graph/not-a-card.jpg',
  ]);
});

test('blank, directory-only, and non-HTTP og:image values are rejected', async (t) => {
  const card = await jpeg(1200, 630);
  const buildDir = await fixtureBuild(t, {
    pages: [
      page('ok.html', docHead('Ok | Serverpod', cardMeta(IDS.valid))),
      page(
        'blank.html',
        docHead('B | Serverpod', '<meta property="og:image" content="">')
      ),
      page(
        'spaces.html',
        docHead('S | Serverpod', '<meta property="og:image" content="   ">')
      ),
      page(
        'dir.html',
        docHead(
          'D | Serverpod',
          '<meta property="og:image" content="https://docs.serverpod.dev/img/open-graph">'
        )
      ),
      page(
        'dir-slash.html',
        docHead(
          'E | Serverpod',
          '<meta property="og:image" content="https://docs.serverpod.dev/img/open-graph/">'
        )
      ),
      page(
        'scheme.html',
        docHead(
          'F | Serverpod',
          `<meta property="og:image" content="ftp://docs.serverpod.dev/img/open-graph/${IDS.valid}.jpg">`
        )
      ),
    ],
    cards: { [`${IDS.valid}.jpg`]: card },
  });

  const { failures } = await verifyBuild(buildDir);
  assert.deepEqual(failures.sort(), [
    'blank.html has a blank og:image',
    'dir-slash.html has a malformed card path: https://docs.serverpod.dev/img/open-graph/',
    'dir.html has a malformed card path: https://docs.serverpod.dev/img/open-graph',
    `scheme.html has a non-HTTP og:image URL: ftp://docs.serverpod.dev/img/open-graph/${IDS.valid}.jpg`,
    'spaces.html has a blank og:image',
  ]);
});

test('BOM pages, contentless tags, and doubled slashes cannot hide failures', async (t) => {
  const card = await jpeg(1200, 630);
  const buildDir = await fixtureBuild(t, {
    pages: [
      page('ok.html', docHead('Ok | Serverpod', cardMeta(IDS.valid))),
      [
        'bom.html',
        '\uFEFF<html><head>' +
          docHead(
            'A | Serverpod',
            '<meta property="og:title" content="B | Serverpod">' +
              '<meta property="og:image" content="">'
          ) +
          '</head><body></body></html>',
      ],
      page(
        'contentless.html',
        docHead(
          'C | Serverpod',
          `${cardMeta(IDS.valid)}<meta property="og:image">`
        )
      ),
      page(
        'double-slash.html',
        docHead(
          'D | Serverpod',
          `<meta property="og:image" content="https://docs.serverpod.dev//img/open-graph/${IDS.missing}.jpg">`
        )
      ),
    ],
    cards: { [`${IDS.valid}.jpg`]: card },
  });

  const { failures } = await verifyBuild(buildDir);
  assert.deepEqual(failures.sort(), [
    'bom.html has 2 conflicting og:title tags',
    'bom.html has a blank og:image',
    'contentless.html has a blank og:image',
    `double-slash.html references missing card ${IDS.missing}.jpg`,
  ]);
});

test('an eligible docs page without any og:image fails coverage', async (t) => {
  const card = await jpeg(1200, 630);
  const buildDir = await fixtureBuild(t, {
    pages: [
      page('ok.html', docHead('Ok | Serverpod', cardMeta(IDS.valid))),
      page('uncovered.html', docHead('Uncovered | Serverpod')),
    ],
    cards: { [`${IDS.valid}.jpg`]: card },
  });

  const { failures } = await verifyBuild(buildDir);
  assert.deepEqual(failures, ['docs page uncovered.html has no og:image']);
});

test('a build with no generated cards at all fails', async (t) => {
  const buildDir = await fixtureBuild(t, {
    pages: [page('plain.html', '<title>no og image</title>')],
    cards: {},
  });

  const { failures } = await verifyBuild(buildDir);
  assert.deepEqual(failures, [
    'no page references a generated Open Graph card',
  ]);
});
