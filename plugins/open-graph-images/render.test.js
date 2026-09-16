const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const sharp = require('sharp');

const { CARD_HEIGHT, CARD_WIDTH, normalizeMetadata } = require('./shared');
const {
  cardSvg,
  fitText,
  measureText,
  parseFont,
  renderCard,
  wrapText,
} = require('./render');

const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const ICON_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWNYrGbxHxkzkC4AADdQIAHwHnrCAAAAAElFTkSuQmCC',
  'base64'
);
const REGULAR_FONT_BUFFER = fs.readFileSync(
  path.join(__dirname, 'fonts', 'Inter-Regular.otf')
);
const BLACK_FONT_BUFFER = fs.readFileSync(
  path.join(__dirname, 'fonts', 'Inter-Black.otf')
);

function cardSvgFixture(overrides = {}) {
  return cardSvg({
    title: 'Database and ORM',
    description: 'Build type-safe database models.',
    logoSvg: LOGO_SVG,
    iconPng: ICON_PNG,
    regularFontBuffer: REGULAR_FONT_BUFFER,
    blackFontBuffer: BLACK_FONT_BUFFER,
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

test('an over-wide token fills remaining lines instead of ending the text', () => {
  const measure = (value) => value.length * 10;
  assert.deepEqual(
    wrapText('Toolong word fits here', {
      measureText: (v) => (v.startsWith('Toolong') ? 300 : measure(v)),
      maxWidth: 240,
      maxLines: 2,
    }),
    { lines: ['Toolon…', 'word fits here'], truncated: true }
  );
});

test('shaping applies GPOS kerning', () => {
  const black = parseFont(BLACK_FONT_BUFFER);
  const kerned = measureText(black, 'To', 64);
  const unkerned = measureText(black, 'T', 64) + measureText(black, 'o', 64);
  assert.ok(
    unkerned - kerned > 2,
    `expected a kerned 'To' to be tighter: ${kerned} vs ${unkerned}`
  );
});

test('title tiers resolve by measured width', () => {
  const black = parseFont(BLACK_FONT_BUFFER);
  const tier = (title) =>
    fitText(title, {
      font: black,
      fontSizes: [64, 56, 50],
      maxWidth: 730,
      maxLines: 1,
    });
  assert.equal(tier('Database and ORM').fontSize, 64);
  assert.equal(tier('Authentication providers').fontSize, 56);
  assert.equal(tier('Creating endpoint methods').fontSize, 50);
  assert.equal(tier('Creating endpoint methods').lines.length, 1);
});

test('truncates at word boundaries without stacking punctuation', () => {
  const measureText = (value) => value.length * 10;
  assert.deepEqual(
    wrapText('alpha beta gamma', { measureText, maxWidth: 100, maxLines: 1 }),
    { lines: ['alpha…'], truncated: true }
  );
  assert.deepEqual(
    wrapText('evolves. and more', { measureText, maxWidth: 90, maxLines: 1 }),
    { lines: ['evolves…'], truncated: true }
  );
});

test('converts metadata to paths and embeds the logo and icon', () => {
  const svg = cardSvgFixture({
    title: 'serverpod_auth<T> & "Dart"',
    description: 'C++',
  });

  assert.doesNotMatch(svg, /serverpod_auth|&lt;T&gt;|<text/);
  assert.match(svg, /<clipPath id="text-area">/);
  assert.match(svg, /<g clip-path="url\(#text-area\)">\s+<path d="/);
  const embedded = [
    ...svg.matchAll(/href="data:image\/(svg\+xml|png);base64,([^"]+)"/g),
  ];
  assert.deepEqual(
    embedded.map((match) => match[1]),
    ['svg+xml', 'png']
  );
  assert.equal(
    Buffer.from(embedded[0][2], 'base64').toString('utf8'),
    LOGO_SVG
  );
  assert.ok(Buffer.from(embedded[1][2], 'base64').equals(ICON_PNG));
});

test('reports metadata characters that the pinned font cannot render', () => {
  assert.throws(
    () => cardSvgFixture({ title: 'Launch 🚀' }),
    /Open Graph title contains unsupported .*U\+1F680/
  );
});

test('keeps the measured feature-card geometry', () => {
  const svg = cardSvgFixture();

  assert.match(svg, /<stop offset="0" stop-color="#0b1b4f"\/>/);
  assert.match(svg, /<stop offset="1" stop-color="#247bca"\/>/);
  assert.match(svg, /stop-color="#96b2de" stop-opacity="0.55"/);
  assert.match(
    svg,
    /<image href="data:image\/svg\+xml;base64,[^"]+" x="134" y="96" width="266" height="72"\/>/
  );
  assert.match(
    svg,
    /<image href="data:image\/png;base64,[^"]+" x="96" y="234" width="216" height="216"\/>/
  );
  assert.match(svg, /<rect x="334" y="190" width="750" height="420"\/>/);
});

test('descriptions cap at two rendered lines', () => {
  const whiteLines = (svg) => [...svg.matchAll(/fill="#ffffff"/g)].length;
  assert.equal(
    whiteLines(
      cardSvgFixture({
        description:
          'Serverpod comes bundled with a simple-to-use but powerful migration system that helps you keep your database schema up to date as your project evolves over many releases.',
      })
    ),
    3
  );
});

test('the icon centers on the text block across layouts', () => {
  const iconY = (svg) => svg.match(/y="(-?\d+)" width="216"/)[1];
  assert.equal(iconY(cardSvgFixture()), '234');
  assert.equal(
    iconY(
      cardSvgFixture({
        title: 'Serialize objects and share them between server and app',
      })
    ),
    '267'
  );
  assert.equal(iconY(cardSvgFixture({ description: '' })), '196');
  assert.equal(
    iconY(
      cardSvgFixture({
        description:
          'Serverpod comes bundled with a simple-to-use but powerful migration system that helps you keep your database schema up to date.',
      })
    ),
    '257'
  );
});

test('prefers a smaller single-line title over a wrapped one', () => {
  const whiteLines = (svg) => [...svg.matchAll(/fill="#ffffff"/g)].length;
  assert.equal(
    whiteLines(
      cardSvgFixture({ title: 'Creating endpoint methods', description: '' })
    ),
    1
  );
  assert.equal(
    whiteLines(
      cardSvgFixture({
        title: 'Serialize objects and share them between server and app',
        description: '',
      })
    ),
    2
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
    iconPng: ICON_PNG,
    regularFontBuffer: REGULAR_FONT_BUFFER,
    blackFontBuffer: BLACK_FONT_BUFFER,
    outputPath,
  });

  const metadata = await sharp(outputPath).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, CARD_WIDTH);
  assert.equal(metadata.height, CARD_HEIGHT);
});
