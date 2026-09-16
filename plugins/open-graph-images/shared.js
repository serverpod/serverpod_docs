// Imported by both the build plugin and the client theme bundle: keep this
// module free of Node built-ins.

const { sha256 } = require('@noble/hashes/sha256');
const { bytesToHex, utf8ToBytes } = require('@noble/hashes/utils');

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const PUBLIC_PATH = '/img/open-graph';

function normalizeMetadata(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256Hex(value) {
  const bytes = typeof value === 'string' ? utf8ToBytes(value) : value;
  return bytesToHex(sha256(bytes));
}

function shouldGenerateCard({ title }) {
  return normalizeMetadata(title) !== '';
}

function cardId({ title, description, renderFingerprint }) {
  if (typeof renderFingerprint !== 'string' || !renderFingerprint) {
    throw new Error('A render fingerprint is required to create a card ID.');
  }

  return sha256Hex(
    JSON.stringify([
      normalizeMetadata(title),
      normalizeMetadata(description),
      renderFingerprint,
    ])
  ).slice(0, 20);
}

function cardPath(id) {
  if (!/^[a-f0-9]{20}$/.test(id)) {
    throw new Error(`Invalid Open Graph card ID: ${id}`);
  }
  return `${PUBLIC_PATH}/${id}.jpg`;
}

function openGraphImageForDoc({
  assetImage,
  frontMatterImage,
  title,
  description,
  renderFingerprint,
}) {
  const explicitImage = assetImage ?? frontMatterImage;
  const generatedImage =
    explicitImage == null && shouldGenerateCard({ title })
      ? cardPath(cardId({ title, description, renderFingerprint }))
      : undefined;
  return {
    generatedImage,
    image: explicitImage ?? generatedImage,
  };
}

module.exports = {
  CARD_HEIGHT,
  CARD_WIDTH,
  PUBLIC_PATH,
  cardId,
  cardPath,
  normalizeMetadata,
  openGraphImageForDoc,
  sha256Hex,
  shouldGenerateCard,
};
