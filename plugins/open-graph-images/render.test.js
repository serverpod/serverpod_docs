const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const sharp = require('sharp');

const {
  CARD_HEIGHT,
  CARD_WIDTH,
  normalizeMetadata,
  sha256Hex,
} = require('./shared');
const { cardSvg, renderCard, wrapText } = require('./render');

const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor"/>';
const REGULAR_FONT_BUFFER = fs.readFileSync(
  require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf')
);
const BOLD_FONT_BUFFER = fs.readFileSync(
  require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf')
);

function cardSvgFixture(overrides = {}) {
  return cardSvg({
    title: 'Database and ORM',
    description: 'Build type-safe database models.',
    logoSvg: LOGO_SVG,
    iconSvg: ICON_SVG,
    regularFontBuffer: REGULAR_FONT_BUFFER,
    boldFontBuffer: BOLD_FONT_BUFFER,
    ...overrides,
  });
}

test('preserves identifiers and punctuation from Docusaurus metadata', () => {
  assert.equal(
    normalizeMetadata(
      'Use serverpod_auth_idp<T> with serverpod_cloud_deploy, C++ & Dart.'
    ),
    'Use serverpod_auth_idp<T> with serverpod_cloud_deploy, C++ & Dart.'
  );
});

test('ellipsizes an over-width token instead of allowing it to overflow', () => {
  const token = 'ServerpodClientSharedStreamingMethods'.repeat(20);
  const wrapped = wrapText(token, {
    measureText: (value) => value.length * 10,
    maxWidth: 240,
    maxLines: 2,
  });

  assert.equal(wrapped.truncated, true);
  assert.equal(wrapped.lines.length, 1);
  assert.match(wrapped.lines[0], /…$/);
  assert.ok(wrapped.lines[0].length < token.length);
});

test('converts metadata to paths and applies one currentColor transformation', () => {
  const svg = cardSvgFixture({
    title: 'serverpod_auth<T> & "Dart"',
    description: 'C++',
  });
  const embeddedSvgs = [...svg.matchAll(/base64,([^"]+)/g)].map((match) =>
    Buffer.from(match[1], 'base64').toString('utf8')
  );

  assert.doesNotMatch(svg, /serverpod_auth|&lt;T&gt;|<text/);
  assert.match(svg, /<clipPath id="text-area">/);
  assert.match(svg, /<g clip-path="url\(#text-area\)">\s+<path d="/);
  assert.equal(embeddedSvgs.length, 2);
  assert.match(embeddedSvgs[1], /stroke="#f5fbff"/);
  assert.doesNotMatch(embeddedSvgs[1], /currentColor|<svg color=/);
});

test('reports metadata characters that the pinned font cannot render', () => {
  assert.throws(
    () => cardSvgFixture({ title: 'Launch 🚀' }),
    /Open Graph title contains unsupported .*U\+1F680/
  );
});

test('keeps the feature-card visual structure', () => {
  const svg = cardSvgFixture();

  assert.match(svg, /<stop offset="0" stop-color="#091838"\/>/);
  assert.match(svg, /<stop offset="1" stop-color="#248fd1"\/>/);
  assert.match(
    svg,
    /<image href="[^"]+" x="140" y="98" width="266" height="72"\/>/
  );
  assert.match(
    svg,
    /<image href="[^"]+" x="140" y="267" width="158" height="158"/
  );
  assert.match(svg, /<g clip-path="url\(#text-area\)">/);
});

test('matches the feature-card SVG snapshot', () => {
  assert.equal(
    sha256Hex(cardSvgFixture()),
    'afca99e49b45aa1ba49207b12719d3f5e1ddde109b3aa61b5f350d050c77dade'
  );
});

test('renders the expected JPEG dimensions', async (t) => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-render-')
  );
  t.after(() =>
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
  );
  const outputPath = path.join(temporaryDirectory, 'card.jpg');

  await renderCard({
    title: 'Quickstart',
    description: 'Create and run a Serverpod project.',
    logoSvg: LOGO_SVG,
    iconSvg: ICON_SVG,
    regularFontBuffer: REGULAR_FONT_BUFFER,
    boldFontBuffer: BOLD_FONT_BUFFER,
    outputPath,
  });

  const metadata = await sharp(outputPath).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, CARD_WIDTH);
  assert.equal(metadata.height, CARD_HEIGHT);
});
