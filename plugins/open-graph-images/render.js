const sharp = require('sharp');
const opentype = require('opentype.js');

const { CARD_HEIGHT, CARD_WIDTH, normalizeMetadata } = require('./shared');

const TEXT_X = 374;
const TEXT_MAX_WIDTH = 700;
const JPEG_OPTIONS = Object.freeze({ quality: 88, progressive: true });
const FONT_OPTIONS = Object.freeze({ kerning: true });
const parsedFontByBuffer = new WeakMap();

function parseFont(fontBuffer) {
  const cached = parsedFontByBuffer.get(fontBuffer);
  if (cached) {
    return cached;
  }

  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );
  const font = opentype.parse(arrayBuffer);
  parsedFontByBuffer.set(fontBuffer, font);
  return font;
}

function assertFontCoverage(value, font, fieldName) {
  const unsupportedCharacters = [
    ...new Set(
      [...normalizeMetadata(value)].filter(
        (character) =>
          !/\s/.test(character) && font.charToGlyphIndex(character) === 0
      )
    ),
  ];
  if (unsupportedCharacters.length === 0) {
    return;
  }

  const details = unsupportedCharacters
    .map(
      (character) =>
        `${JSON.stringify(character)} (U+${character
          .codePointAt(0)
          .toString(16)
          .toUpperCase()})`
    )
    .join(', ');
  throw new Error(
    `Open Graph ${fieldName} contains unsupported characters: ${details}.`
  );
}

function ellipsize(text, { measureText, maxWidth }) {
  const ellipsis = '…';
  if (measureText(ellipsis) > maxWidth) {
    return '';
  }

  let prefix = '';
  for (const character of text.trimEnd()) {
    const candidate = `${prefix}${character}${ellipsis}`;
    if (measureText(candidate) > maxWidth) {
      break;
    }
    prefix += character;
  }
  return `${prefix.trimEnd()}${ellipsis}`;
}

function wrapText(text, { measureText, maxWidth, maxLines }) {
  const words = normalizeMetadata(text).split(' ').filter(Boolean);
  if (words.length === 0) {
    return { lines: [], truncated: false };
  }
  if (maxLines < 1 || maxWidth <= 0) {
    return { lines: [], truncated: true };
  }

  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      if (measureText(word) > maxWidth) {
        lines.push(ellipsize(word, { measureText, maxWidth }));
        return { lines, truncated: true };
      }
      currentLine = word;
      continue;
    }

    const candidate = `${currentLine} ${word}`;
    if (measureText(candidate) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    if (lines.length === maxLines) {
      lines[lines.length - 1] = ellipsize(lines.at(-1), {
        measureText,
        maxWidth,
      });
      return { lines, truncated: true };
    }

    if (measureText(word) > maxWidth) {
      lines.push(ellipsize(word, { measureText, maxWidth }));
      return { lines, truncated: true };
    }
    currentLine = word;
  }

  lines.push(currentLine);
  return { lines, truncated: false };
}

function fitText(text, { font, fontSizes, maxWidth, maxLines }) {
  for (const fontSize of fontSizes) {
    const measureText = (value) =>
      font.getAdvanceWidth(value, fontSize, FONT_OPTIONS);
    const wrapped = wrapText(text, { measureText, maxWidth, maxLines });
    if (!wrapped.truncated) {
      return { ...wrapped, fontSize };
    }
  }

  const fontSize = fontSizes.at(-1);
  const measureText = (value) =>
    font.getAdvanceWidth(value, fontSize, FONT_OPTIONS);
  return {
    ...wrapText(text, { measureText, maxWidth, maxLines }),
    fontSize,
  };
}

function svgDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function colorizeIconSvg(svg) {
  return svg.replaceAll('currentColor', '#f5fbff');
}

function textPathElements(
  lines,
  { font, x, firstBaseline, lineHeight, fontSize }
) {
  return lines
    .map((line, index) => {
      const baseline = firstBaseline + index * lineHeight;
      const pathData = font
        .getPath(line, x, baseline, fontSize, FONT_OPTIONS)
        .toPathData(2);
      return `<path d="${pathData}" fill="#ffffff"/>`;
    })
    .join('');
}

function cardSvg({
  title,
  description,
  logoSvg,
  iconSvg,
  regularFontBuffer,
  boldFontBuffer,
}) {
  const regularFont = parseFont(regularFontBuffer);
  const boldFont = parseFont(boldFontBuffer);
  assertFontCoverage(title, boldFont, 'title');
  assertFontCoverage(description, regularFont, 'description');
  const fittedTitle = fitText(title, {
    font: boldFont,
    fontSizes: [62, 56, 50],
    maxWidth: TEXT_MAX_WIDTH,
    maxLines: 2,
  });
  const fittedDescription = fitText(description, {
    font: regularFont,
    fontSizes: [38, 35, 32, 29],
    maxWidth: TEXT_MAX_WIDTH,
    maxLines: 4,
  });

  const titleFirstBaseline = fittedTitle.lines.length > 1 ? 289 : 323;
  const titleLineHeight = Math.round(fittedTitle.fontSize * 1.1);
  const descriptionFirstBaseline =
    titleFirstBaseline +
    Math.max(0, fittedTitle.lines.length - 1) * titleLineHeight +
    69;
  const descriptionLineHeight = Math.round(fittedDescription.fontSize * 1.18);

  const titleElements = textPathElements(fittedTitle.lines, {
    font: boldFont,
    x: TEXT_X,
    firstBaseline: titleFirstBaseline,
    lineHeight: titleLineHeight,
    fontSize: fittedTitle.fontSize,
  });
  const descriptionElements = textPathElements(fittedDescription.lines, {
    font: regularFont,
    x: TEXT_X,
    firstBaseline: descriptionFirstBaseline,
    lineHeight: descriptionLineHeight,
    fontSize: fittedDescription.fontSize,
  });

  return `
<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="${CARD_WIDTH / 2}" y1="0" x2="${CARD_WIDTH / 2}" y2="${CARD_HEIGHT}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#091838"/>
      <stop offset="0.45" stop-color="#003678"/>
      <stop offset="1" stop-color="#248fd1"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(751 640) rotate(-90) scale(392 703)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3db7ff" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#3db7ff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="240" height="96" patternUnits="userSpaceOnUse">
      <path d="M0 95.5H240M239.5 0V96" stroke="#8acfff" stroke-opacity="0.04"/>
    </pattern>
    <filter id="icon-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#001b43" flood-opacity="0.55"/>
    </filter>
    <clipPath id="text-area">
      <rect x="${TEXT_X}" y="200" width="${TEXT_MAX_WIDTH}" height="380"/>
    </clipPath>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#background)"/>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#glow)"/>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#grid)"/>
  <image href="${svgDataUri(logoSvg)}" x="140" y="98" width="266" height="72"/>
  <image href="${svgDataUri(colorizeIconSvg(iconSvg))}" x="140" y="267" width="158" height="158" filter="url(#icon-shadow)"/>
  <g clip-path="url(#text-area)">
    ${titleElements}
    ${descriptionElements}
  </g>
</svg>`.trim();
}

async function renderCard({
  title,
  description,
  logoSvg,
  iconSvg,
  regularFontBuffer,
  boldFontBuffer,
  outputPath,
}) {
  const svg = cardSvg({
    title,
    description,
    logoSvg,
    iconSvg,
    regularFontBuffer,
    boldFontBuffer,
  });
  await sharp(Buffer.from(svg)).jpeg(JPEG_OPTIONS).toFile(outputPath);
}

module.exports = {
  JPEG_OPTIONS,
  cardSvg,
  renderCard,
  wrapText,
};
