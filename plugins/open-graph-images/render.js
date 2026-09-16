const fontkit = require('fontkit');
const sharp = require('sharp');

const { CARD_HEIGHT, CARD_WIDTH, normalizeMetadata } = require('./shared');

// Geometry constants are measured from the serverpod.dev feature-page cards.
const TEXT_X = 344;
const TEXT_MAX_WIDTH = 730;
const TITLE_BASELINE = 325;
const TITLE_DESCRIPTION_BASELINE_GAP = 69;
const DESCRIPTION_FONT_SIZE = 38.5;
const DESCRIPTION_LINE_HEIGHT = 46;
const ICON_X = 96;
const ICON_SIZE = 216;
const ICON_BODY_TOP_FRACTION = 21 / 256;
const ICON_BODY_BOTTOM_FRACTION = 234 / 256;
const LOGO_BOX = Object.freeze({ x: 134, y: 96, width: 266, height: 72 });
const TEXT_COLOR = '#ffffff';
const JPEG_OPTIONS = Object.freeze({ quality: 88, progressive: true });
const parsedFontByBuffer = new WeakMap();

function parseFont(fontBuffer) {
  const cached = parsedFontByBuffer.get(fontBuffer);
  if (cached) {
    return cached;
  }

  const font = fontkit.create(fontBuffer);
  parsedFontByBuffer.set(fontBuffer, font);
  return font;
}

function measureText(font, text, fontSize) {
  return (font.layout(text).advanceWidth * fontSize) / font.unitsPerEm;
}

function glyphPathData(glyph, x, y, scale) {
  const fmt = (value) => Math.round(value * 100) / 100;
  let pathData = '';
  for (const { command, args } of glyph.path.commands) {
    if (command === 'closePath') {
      pathData += 'Z';
      continue;
    }
    const points = [];
    for (let i = 0; i < args.length; i += 2) {
      points.push(fmt(x + args[i] * scale), fmt(y - args[i + 1] * scale));
    }
    const letter =
      command === 'moveTo'
        ? 'M'
        : command === 'lineTo'
          ? 'L'
          : command === 'quadraticCurveTo'
            ? 'Q'
            : 'C';
    pathData += letter + points.join(' ');
  }
  return pathData;
}

function textPathData(font, text, x, baseline, fontSize) {
  const run = font.layout(text);
  const scale = fontSize / font.unitsPerEm;
  let cursor = x;
  let pathData = '';
  run.glyphs.forEach((glyph, index) => {
    const position = run.positions[index];
    pathData += glyphPathData(
      glyph,
      cursor + position.xOffset * scale,
      baseline - position.yOffset * scale,
      scale
    );
    cursor += position.xAdvance * scale;
  });
  return pathData;
}

function assertFontCoverage(value, font, fieldName) {
  const unsupportedCharacters = [
    ...new Set(
      [...normalizeMetadata(value)].filter(
        (character) =>
          !/\s/.test(character) &&
          !font.hasGlyphForCodePoint(character.codePointAt(0))
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

  const source = text.trimEnd();
  let prefix = '';
  let cutMidWord = false;
  for (const character of source) {
    if (measureText(`${prefix}${character}${ellipsis}`) > maxWidth) {
      cutMidWord = true;
      break;
    }
    prefix += character;
  }
  if (cutMidWord) {
    const lastSpace = prefix.lastIndexOf(' ');
    if (lastSpace > 0) {
      prefix = prefix.slice(0, lastSpace);
    }
  }
  return `${prefix.replace(/[\s.,;:!?]+$/u, '')}${ellipsis}`;
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
  let cutToken = false;

  for (const word of words) {
    if (!currentLine) {
      if (measureText(word) > maxWidth) {
        lines.push(ellipsize(word, { measureText, maxWidth }));
        cutToken = true;
        if (lines.length === maxLines) {
          return { lines, truncated: true };
        }
        continue;
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
    currentLine = '';
    if (lines.length === maxLines) {
      lines[lines.length - 1] = ellipsize(lines.at(-1), {
        measureText,
        maxWidth,
      });
      return { lines, truncated: true };
    }

    if (measureText(word) > maxWidth) {
      lines.push(ellipsize(word, { measureText, maxWidth }));
      cutToken = true;
      if (lines.length === maxLines) {
        return { lines, truncated: true };
      }
      continue;
    }
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }
  return { lines, truncated: cutToken };
}

function fitText(text, { font, fontSizes, maxWidth, maxLines }) {
  for (const fontSize of fontSizes) {
    const measure = (value) => measureText(font, value, fontSize);
    const wrapped = wrapText(text, {
      measureText: measure,
      maxWidth,
      maxLines,
    });
    if (!wrapped.truncated) {
      return { ...wrapped, fontSize };
    }
  }

  const fontSize = fontSizes.at(-1);
  const measure = (value) => measureText(font, value, fontSize);
  return {
    ...wrapText(text, { measureText: measure, maxWidth, maxLines }),
    fontSize,
  };
}

function svgDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function pngDataUri(png) {
  return `data:image/png;base64,${png.toString('base64')}`;
}

function textPathElements(
  lines,
  { font, x, firstBaseline, lineHeight, fontSize }
) {
  return lines
    .map((line, index) => {
      const baseline = firstBaseline + index * lineHeight;
      const pathData = textPathData(font, line, x, baseline, fontSize);
      return `<path d="${pathData}" fill="${TEXT_COLOR}"/>`;
    })
    .join('');
}

function cardSvg({
  title,
  description,
  logoSvg,
  iconPng,
  regularFontBuffer,
  blackFontBuffer,
}) {
  const regularFont = parseFont(regularFontBuffer);
  const blackFont = parseFont(blackFontBuffer);
  assertFontCoverage(title, blackFont, 'title');
  assertFontCoverage(description, regularFont, 'description');

  const titleOptions = {
    font: blackFont,
    fontSizes: [64, 56, 50],
    maxWidth: TEXT_MAX_WIDTH,
  };
  let fittedTitle = fitText(title, { ...titleOptions, maxLines: 1 });
  if (fittedTitle.truncated) {
    fittedTitle = fitText(title, { ...titleOptions, maxLines: 2 });
  }
  const fittedDescription = fitText(description, {
    font: regularFont,
    fontSizes: [DESCRIPTION_FONT_SIZE],
    maxWidth: TEXT_MAX_WIDTH,
    maxLines: 2,
  });

  const titleLineHeight = Math.round(fittedTitle.fontSize * 1.11);
  const titleLastBaseline =
    TITLE_BASELINE +
    Math.max(0, fittedTitle.lines.length - 1) * titleLineHeight;
  const descriptionFirstBaseline =
    titleLastBaseline + TITLE_DESCRIPTION_BASELINE_GAP;

  const textBlockTop =
    TITLE_BASELINE -
    (blackFont.capHeight * fittedTitle.fontSize) / blackFont.unitsPerEm;
  const textBlockBottom = fittedDescription.lines.length
    ? descriptionFirstBaseline +
      (fittedDescription.lines.length - 1) * DESCRIPTION_LINE_HEIGHT +
      DESCRIPTION_FONT_SIZE * 0.27
    : titleLastBaseline + fittedTitle.fontSize * 0.05;
  const iconBodyHeight =
    (ICON_BODY_BOTTOM_FRACTION - ICON_BODY_TOP_FRACTION) * ICON_SIZE;
  const iconY = Math.round(
    (textBlockTop + textBlockBottom) / 2 -
      iconBodyHeight / 2 -
      ICON_BODY_TOP_FRACTION * ICON_SIZE
  );

  const titleElements = textPathElements(fittedTitle.lines, {
    font: blackFont,
    x: TEXT_X,
    firstBaseline: TITLE_BASELINE,
    lineHeight: titleLineHeight,
    fontSize: fittedTitle.fontSize,
  });
  const descriptionElements = textPathElements(fittedDescription.lines, {
    font: regularFont,
    x: TEXT_X,
    firstBaseline: descriptionFirstBaseline,
    lineHeight: DESCRIPTION_LINE_HEIGHT,
    fontSize: fittedDescription.fontSize,
  });

  return `
<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="${CARD_WIDTH / 2}" y1="0" x2="${CARD_WIDTH / 2}" y2="${CARD_HEIGHT}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0b1b4f"/>
      <stop offset="0.3" stop-color="#00256e"/>
      <stop offset="0.57" stop-color="#004590"/>
      <stop offset="0.83" stop-color="#1768b7"/>
      <stop offset="1" stop-color="#247bca"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(80 760) scale(1100 520)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#96b2de" stop-opacity="0.55"/>
      <stop offset="0.55" stop-color="#96b2de" stop-opacity="0.231"/>
      <stop offset="1" stop-color="#96b2de" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="text-area">
      <rect x="${TEXT_X - 10}" y="190" width="${TEXT_MAX_WIDTH + 20}" height="420"/>
    </clipPath>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#background)"/>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#glow)"/>
  <image href="${svgDataUri(logoSvg)}" x="${LOGO_BOX.x}" y="${LOGO_BOX.y}" width="${LOGO_BOX.width}" height="${LOGO_BOX.height}"/>
  <image href="${pngDataUri(iconPng)}" x="${ICON_X}" y="${iconY}" width="${ICON_SIZE}" height="${ICON_SIZE}"/>
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
  iconPng,
  regularFontBuffer,
  blackFontBuffer,
  outputPath,
}) {
  const svg = cardSvg({
    title,
    description,
    logoSvg,
    iconPng,
    regularFontBuffer,
    blackFontBuffer,
  });
  await sharp(Buffer.from(svg)).jpeg(JPEG_OPTIONS).toFile(outputPath);
}

module.exports = {
  JPEG_OPTIONS,
  cardSvg,
  fitText,
  measureText,
  parseFont,
  renderCard,
  wrapText,
};
