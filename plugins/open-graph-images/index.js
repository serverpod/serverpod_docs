const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const sharp = require('sharp');

const { renderCard } = require('./render');
const {
  CARD_HEIGHT,
  CARD_WIDTH,
  OG_ICON_FILE_BY_CLASS,
  PUBLIC_PATH,
  cardIdentityForDoc,
  publicPathWithBaseUrl,
  sha256Hex,
} = require('./shared');

const PLUGIN_NAME = 'serverpod-open-graph-images';
const ASSET_DIRECTORY = `${PLUGIN_NAME}-assets`;
const DOCS_PLUGIN = 'docusaurus-plugin-content-docs';
const RENDER_FINGERPRINT_DEFINE =
  '__SERVERPOD_OG_RENDER_FINGERPRINTS_BY_ICON__';
const RENDER_CONCURRENCY = 6;
const STALE_TEMP_FILE_AGE_MS = 60 * 60 * 1000;
const OPENTYPE_VERSION = require('opentype.js/package.json').version;

async function mapWithConcurrency(items, concurrency, callback) {
  let nextIndex = 0;
  let firstError;
  let didFail = false;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (!didFail && nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        try {
          await callback(items[index]);
        } catch (error) {
          if (!didFail) {
            didFail = true;
            firstError = error;
          }
        }
      }
    }
  );
  await Promise.all(workers);
  if (didFail) {
    throw firstError;
  }
}

module.exports = function openGraphImagesPlugin(context) {
  const generatedDir = path.join(context.generatedFilesDir, ASSET_DIRECTORY);
  const renderSource = fs
    .readFileSync(require.resolve('./render'), 'utf8')
    .replaceAll('\r\n', '\n');
  const staticImageDir = path.join(context.siteDir, 'static', 'img');
  const logoPath = path.join(staticImageDir, 'logo-horizontal-dark.svg');
  const regularFontPath =
    require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
  const boldFontPath =
    require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');
  const iconFileNames = [
    ...new Set(Object.values(OG_ICON_FILE_BY_CLASS)),
  ].sort();
  const iconPaths = iconFileNames.map((fileName) =>
    path.join(staticImageDir, fileName)
  );
  // Docusaurus does not reload plugin modules in place. JavaScript and font
  // dependency changes require a dev-server restart; source assets can reload.
  const watchedPaths = [logoPath, ...iconPaths];
  const fileCache = new Map();
  let referencedCardIds = new Set();
  let publishedCardIds = new Set();
  let contentLoadQueue = Promise.resolve();

  function readFileCached(filePath, encoding) {
    const { mtimeMs, size } = fs.statSync(filePath);
    const cached = fileCache.get(filePath);
    if (cached?.mtimeMs === mtimeMs && cached.size === size) {
      return cached.content;
    }

    const content = fs.readFileSync(filePath, encoding);
    fileCache.set(filePath, { mtimeMs, size, content });
    return content;
  }

  function loadRenderAssets() {
    const logoSvg = readFileCached(logoPath, 'utf8');
    const iconSvgByFileName = new Map(
      iconFileNames.map((fileName) => [
        fileName,
        readFileCached(path.join(staticImageDir, fileName), 'utf8'),
      ])
    );
    const regularFontBuffer = readFileCached(regularFontPath);
    const boldFontBuffer = readFileCached(boldFontPath);
    const sharedInputs = [
      ['renderSource', renderSource],
      ['cardDimensions', [CARD_WIDTH, CARD_HEIGHT]],
      ['logo-horizontal-dark.svg', logoSvg],
      ['regularFont', sha256Hex(regularFontBuffer)],
      ['boldFont', sha256Hex(boldFontBuffer)],
      ['opentypeVersion', OPENTYPE_VERSION],
      ['sharpVersions', Object.entries(sharp.versions).sort()],
      ['platform', process.platform],
      ['arch', process.arch],
    ];
    const sharedFingerprint = sha256Hex(JSON.stringify(sharedInputs));
    const renderFingerprintByIconFileName = Object.fromEntries(
      iconFileNames.map((fileName) => [
        fileName,
        sha256Hex(
          JSON.stringify([
            sharedFingerprint,
            fileName,
            iconSvgByFileName.get(fileName),
          ])
        ),
      ])
    );
    return {
      iconSvgByFileName,
      logoSvg,
      regularFontBuffer,
      boldFontBuffer,
      renderFingerprintByIconFileName,
    };
  }

  return {
    name: PLUGIN_NAME,

    getPathsToWatch() {
      return watchedPaths;
    },

    allContentLoaded({ allContent }) {
      const operation = contentLoadQueue.then(async () => {
        const startedAt = Date.now();
        const {
          iconSvgByFileName,
          logoSvg,
          regularFontBuffer,
          boldFontBuffer,
          renderFingerprintByIconFileName,
        } = loadRenderAssets();
        const instances = allContent[DOCS_PLUGIN] || {};
        const cardsById = new Map();
        let pageCount = 0;

        for (const content of Object.values(instances)) {
          for (const version of content.loadedVersions || []) {
            for (const doc of version.docs || []) {
              if (doc.frontMatter?.image != null) {
                continue;
              }

              const sidebarItems =
                typeof doc.sidebar === 'string'
                  ? version.sidebars?.[doc.sidebar] || []
                  : [];
              const { id, iconFileName } = cardIdentityForDoc({
                title: doc.title,
                description: doc.description,
                docId: doc.id,
                permalink: doc.permalink,
                directClassName: doc.frontMatter?.sidebar_class_name,
                sidebarItems,
                renderFingerprintByIconFileName,
              });
              pageCount += 1;

              if (!cardsById.has(id)) {
                cardsById.set(id, {
                  title: doc.title,
                  description: doc.description,
                  logoSvg,
                  iconSvg: iconSvgByFileName.get(iconFileName),
                  regularFontBuffer,
                  boldFontBuffer,
                  outputPath: path.join(generatedDir, `${id}.jpg`),
                });
              }
            }
          }
        }

        fs.mkdirSync(generatedDir, { recursive: true });
        const staleBefore = Date.now() - STALE_TEMP_FILE_AGE_MS;
        for (const fileName of fs.readdirSync(generatedDir)) {
          if (/^[a-f0-9]{20}\.jpg\.\d+(?:\.[a-f0-9-]+)?\.tmp$/.test(fileName)) {
            const temporaryPath = path.join(generatedDir, fileName);
            try {
              if (fs.statSync(temporaryPath).mtimeMs < staleBefore) {
                fs.rmSync(temporaryPath, { force: true });
              }
            } catch (error) {
              if (error.code !== 'ENOENT') {
                throw error;
              }
            }
          }
        }

        const cards = [...cardsById.values()];
        await mapWithConcurrency(cards, RENDER_CONCURRENCY, async (card) => {
          if (!fs.existsSync(card.outputPath)) {
            const temporaryPath = `${card.outputPath}.${process.pid}.${randomUUID()}.tmp`;
            try {
              await renderCard({ ...card, outputPath: temporaryPath });
              fs.renameSync(temporaryPath, card.outputPath);
            } finally {
              fs.rmSync(temporaryPath, { force: true });
            }
          }
        });
        referencedCardIds = new Set(cardsById.keys());
        for (const fileName of fs.readdirSync(generatedDir)) {
          const match = /^([a-f0-9]{20})\.jpg$/.exec(fileName);
          if (match && !referencedCardIds.has(match[1])) {
            fs.unlinkSync(path.join(generatedDir, fileName));
          }
        }

        const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
        console.log(
          `[${PLUGIN_NAME}] Prepared ${cards.length} unique social cards for ` +
            `${pageCount} pages in ${seconds}s.`
        );
      });
      contentLoadQueue = operation.catch(() => {});
      return operation;
    },

    configureWebpack(_config, _isServer, { currentBundler }) {
      const { DefinePlugin } = currentBundler.instance;
      const fingerprint = DefinePlugin.runtimeValue(
        () =>
          JSON.stringify(loadRenderAssets().renderFingerprintByIconFileName),
        { fileDependencies: watchedPaths }
      );
      return {
        plugins: [
          new DefinePlugin({
            [RENDER_FINGERPRINT_DEFINE]: fingerprint,
          }),
        ],
        devServer: {
          static: [
            {
              directory: generatedDir,
              publicPath: publicPathWithBaseUrl(context.baseUrl),
              watch: false,
            },
          ],
        },
      };
    },

    postBuild({ outDir }) {
      const outputDir = path.join(outDir, PUBLIC_PATH.replace(/^\//, ''));
      for (const id of publishedCardIds) {
        if (!referencedCardIds.has(id)) {
          fs.rmSync(path.join(outputDir, `${id}.jpg`), { force: true });
        }
      }
      if (referencedCardIds.size === 0) {
        publishedCardIds = new Set();
        return;
      }

      fs.mkdirSync(outputDir, { recursive: true });
      for (const id of [...referencedCardIds].sort()) {
        fs.copyFileSync(
          path.join(generatedDir, `${id}.jpg`),
          path.join(outputDir, `${id}.jpg`)
        );
      }
      publishedCardIds = new Set(referencedCardIds);
    },
  };
};
