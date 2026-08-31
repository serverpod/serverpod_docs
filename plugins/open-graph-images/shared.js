// Browser-safe Open Graph card identity and sidebar helpers. Keep this module
// free of Node built-ins: it is imported by both the generator and the theme.
// Restart the Docusaurus dev server after editing it so both consumers reload.

const { sha256 } = require('@noble/hashes/sha256');
const { bytesToHex, utf8ToBytes } = require('@noble/hashes/utils');

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const PUBLIC_PATH = '/img/open-graph';
const DEFAULT_ICON_CLASS = 'sidebar-icon-reference';

const ICON_FILE_BY_CLASS = Object.freeze({
  'sidebar-installation-icon': 'sidebar-icon-package.svg',
  'sidebar-introduction-icon': 'sidebar-icon-introduction.svg',
  'sidebar-icon-academy': 'sidebar-icon-graduation-cap.svg',
  'sidebar-icon-build-your-first-app': 'sidebar-icon-layers.svg',
  'sidebar-icon-custom-hosting': 'sidebar-icon-server.svg',
  'sidebar-icon-deploy-to-cloud': 'sidebar-icon-cloud-sun.svg',
  'sidebar-icon-deploying': 'sidebar-icon-rocket.svg',
  'sidebar-icon-get-started-step-1': 'sidebar-icon-number-1.svg',
  'sidebar-icon-get-started-step-2': 'sidebar-icon-number-2.svg',
  'sidebar-icon-get-started-step-3': 'sidebar-icon-number-3.svg',
  'sidebar-icon-get-started-step-4': 'sidebar-icon-number-4.svg',
  'sidebar-icon-getting-started': 'sidebar-icon-sprout.svg',
  'sidebar-icon-learn': 'sidebar-icon-graduation-cap.svg',
  'sidebar-icon-overview': 'sidebar-icon-compass.svg',
  'sidebar-icon-quickstart': 'sidebar-icon-zap.svg',
  'sidebar-icon-reference': 'sidebar-icon-book-marked.svg',
  'sidebar-icon-roadmap': 'sidebar-icon-map.svg',
  'sidebar-icon-serverpod-cloud': 'sidebar-icon-cloud-sun.svg',
  'sidebar-icon-serverpod-framework': 'sidebar-icon-layers.svg',
  'sidebar-icon-serverpod-mini': 'sidebar-icon-tree-palm.svg',
  'sidebar-icon-support': 'sidebar-icon-message-circle-question-mark.svg',
  'sidebar-icon-tools': 'sidebar-icon-hammer.svg',
  'sidebar-icon-upgrading': 'sidebar-icon-repeat-2.svg',
});

// Step numbers only make sense inside the ordered sidebar. Social cards use
// standalone icons that describe what each step is about. Update these if the
// tutorial steps are reordered or repurposed.
const OG_ICON_FILE_BY_CLASS = Object.freeze({
  ...ICON_FILE_BY_CLASS,
  'sidebar-icon-get-started-step-1': 'sidebar-icon-server.svg',
  'sidebar-icon-get-started-step-2': 'sidebar-icon-layers.svg',
  'sidebar-icon-get-started-step-3': 'sidebar-icon-database.svg',
  'sidebar-icon-get-started-step-4': 'sidebar-icon-rocket.svg',
});

function normalizeMetadata(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function knownIconClass(className) {
  if (typeof className !== 'string') {
    return undefined;
  }

  return className
    .split(/\s+/)
    .find((candidate) => Object.hasOwn(ICON_FILE_BY_CLASS, candidate));
}

function samePermalink(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const normalize = (value) =>
    value.length > 1 ? value.replace(/\/+$/, '') : value;
  return normalize(left) === normalize(right);
}

/**
 * Finds the nearest icon-bearing category for a doc in either a loaded raw
 * sidebar or the normalized sidebar props available to the theme.
 */
function inheritedIconClassForDoc(items, { docId, permalink }) {
  function walk(sidebarItems, inheritedClass) {
    for (const item of sidebarItems || []) {
      if (item.type === 'category') {
        const categoryClass = knownIconClass(item.className) || inheritedClass;
        const rawCategoryDocMatches =
          item.link?.type === 'doc' && item.link.id === docId;
        const propCategoryDocMatches = samePermalink(item.href, permalink);
        if (rawCategoryDocMatches || propCategoryDocMatches) {
          return { found: true, iconClass: categoryClass };
        }

        const nested = walk(item.items, categoryClass);
        if (nested.found) {
          return nested;
        }
        continue;
      }

      const rawDocMatches =
        (item.type === 'doc' || item.type === 'ref') && item.id === docId;
      const propDocMatches = item.type === 'link' && item.docId === docId;
      if (rawDocMatches || propDocMatches) {
        return {
          found: true,
          iconClass: knownIconClass(item.className) || inheritedClass,
        };
      }
    }

    return { found: false, iconClass: undefined };
  }

  return walk(items, undefined).iconClass;
}

function iconFileNameForDoc({ directClassName, inheritedClassName }) {
  const iconClass =
    knownIconClass(directClassName) ||
    knownIconClass(inheritedClassName) ||
    DEFAULT_ICON_CLASS;
  return OG_ICON_FILE_BY_CLASS[iconClass];
}

function sha256Hex(value) {
  const bytes = typeof value === 'string' ? utf8ToBytes(value) : value;
  return bytesToHex(sha256(bytes));
}

function cardId({ title, description, iconFileName, renderFingerprint }) {
  if (typeof renderFingerprint !== 'string' || !renderFingerprint) {
    throw new Error('A render fingerprint is required to create a card ID.');
  }

  return sha256Hex(
    JSON.stringify([
      normalizeMetadata(title),
      normalizeMetadata(description),
      iconFileName,
      renderFingerprint,
    ])
  ).slice(0, 20);
}

function cardIdentityForDoc({
  title,
  description,
  docId,
  permalink,
  directClassName,
  sidebarItems,
  renderFingerprintByIconFileName,
}) {
  const inheritedClassName = inheritedIconClassForDoc(sidebarItems, {
    docId,
    permalink,
  });
  const iconFileName = iconFileNameForDoc({
    directClassName,
    inheritedClassName,
  });
  return {
    id: cardId({
      title,
      description,
      iconFileName,
      renderFingerprint: renderFingerprintByIconFileName?.[iconFileName],
    }),
    iconFileName,
  };
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
  ...cardIdentity
}) {
  const explicitImage = assetImage ?? frontMatterImage;
  const generatedImage =
    explicitImage == null
      ? cardPath(cardIdentityForDoc(cardIdentity).id)
      : undefined;
  return {
    generatedImage,
    image: explicitImage ?? generatedImage,
  };
}

function publicPathWithBaseUrl(baseUrl) {
  const basePath = String(baseUrl || '/').replace(/^\/+|\/+$/g, '');
  return `/${basePath ? `${basePath}/` : ''}${PUBLIC_PATH.slice(1)}`;
}

module.exports = {
  CARD_HEIGHT,
  CARD_WIDTH,
  ICON_FILE_BY_CLASS,
  OG_ICON_FILE_BY_CLASS,
  PUBLIC_PATH,
  cardIdentityForDoc,
  cardPath,
  normalizeMetadata,
  openGraphImageForDoc,
  publicPathWithBaseUrl,
  sha256Hex,
};
