const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { normalizeUrl } = require('@docusaurus/utils');
const sharp = require('sharp');

const { renderCard } = require('./render');
const {
  CARD_HEIGHT,
  CARD_WIDTH,
  PUBLIC_PATH,
  cardId,
  sha256Hex,
  shouldGenerateCard,
} = require('./shared');

const PLUGIN_NAME = 'serverpod-open-graph-images';
const ASSET_DIRECTORY = `${PLUGIN_NAME}-assets`;
const DOCS_PLUGIN = 'docusaurus-plugin-content-docs';
const RENDER_FINGERPRINT_DEFINE = '__SERVERPOD_OG_RENDER_FINGERPRINT__';
const RENDER_CONCURRENCY = 6;
const STALE_TEMP_FILE_AGE_MS = 60 * 60 * 1000;
const FONTKIT_VERSION = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(require.resolve('fontkit')), '..', 'package.json'),
    'utf8'
  )
).version;

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

module.exports = function openGraphImagesPlugin(context, options = {}) {
  const generatedDir = path.join(context.generatedFilesDir, ASSET_DIRECTORY);
  const renderSource = fs
    .readFileSync(require.resolve('./render'), 'utf8')
    .replaceAll('\r\n', '\n');
  const logoPath = path.join(
    context.siteDir,
    'static',
    'img',
    'logo-horizontal-dark.svg'
  );
  const regularFontPath =
    options.regularFontPath ??
    path.join(__dirname, 'fonts', 'Inter-Regular.otf');
  const blackFontPath =
    options.blackFontPath ?? path.join(__dirname, 'fonts', 'Inter-Black.otf');
  const iconPath =
    options.iconPath ?? path.join(__dirname, 'assets', 'doc-icon.png');
  const watchedPaths = [logoPath, iconPath, regularFontPath, blackFontPath];
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
    const iconPng = readFileCached(iconPath);
    const regularFontBuffer = readFileCached(regularFontPath);
    const blackFontBuffer = readFileCached(blackFontPath);
    const renderFingerprint = sha256Hex(
      JSON.stringify([
        ['renderSource', renderSource],
        ['cardDimensions', [CARD_WIDTH, CARD_HEIGHT]],
        ['logo-horizontal-dark.svg', logoSvg],
        ['doc-icon.png', sha256Hex(iconPng)],
        ['regularFont', sha256Hex(regularFontBuffer)],
        ['blackFont', sha256Hex(blackFontBuffer)],
        ['fontkitVersion', FONTKIT_VERSION],
        ['sharpVersions', Object.entries(sharp.versions).sort()],
        ['platform', process.platform],
        ['arch', process.arch],
      ])
    );
    return {
      logoSvg,
      iconPng,
      regularFontBuffer,
      blackFontBuffer,
      renderFingerprint,
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
          logoSvg,
          iconPng,
          regularFontBuffer,
          blackFontBuffer,
          renderFingerprint,
        } = loadRenderAssets();
        const instances = allContent[DOCS_PLUGIN] || {};
        const cardsById = new Map();
        let pageCount = 0;

        for (const content of Object.values(instances)) {
          for (const version of content.loadedVersions || []) {
            for (const doc of version.docs || []) {
              if (doc.frontMatter?.image != null || !shouldGenerateCard(doc)) {
                continue;
              }

              const id = cardId({
                title: doc.title,
                description: doc.description,
                renderFingerprint,
              });
              pageCount += 1;

              if (!cardsById.has(id)) {
                cardsById.set(id, {
                  title: doc.title,
                  description: doc.description,
                  source: doc.source,
                  logoSvg,
                  iconPng,
                  regularFontBuffer,
                  blackFontBuffer,
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
            } catch (error) {
              throw new Error(
                `Card for "${card.title}" (${card.source}): ${error.message}`,
                { cause: error }
              );
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
        () => JSON.stringify(loadRenderAssets().renderFingerprint),
        {
          fileDependencies: watchedPaths,
          version: loadRenderAssets().renderFingerprint,
        }
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
              publicPath: normalizeUrl([context.baseUrl, PUBLIC_PATH]),
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
        try {
          fs.copyFileSync(
            path.join(generatedDir, `${id}.jpg`),
            path.join(outputDir, `${id}.jpg`),
            fs.constants.COPYFILE_EXCL
          );
        } catch (error) {
          if (error.code !== 'EEXIST' || !publishedCardIds.has(id)) {
            throw error;
          }
        }
      }
      publishedCardIds = new Set(referencedCardIds);
    },
  };
};
