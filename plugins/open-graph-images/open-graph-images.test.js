const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const openGraphImagesPlugin = require('./index');
const {
  cardId,
  cardPath,
  normalizeMetadata,
  openGraphImageForDoc,
  shouldGenerateCard,
} = require('./shared');

const SITE_DIR = path.resolve(__dirname, '..', '..');
const PLUGIN_NAME = 'serverpod-open-graph-images';
const ASSET_DIRECTORY = `${PLUGIN_NAME}-assets`;
const FINGERPRINT_DEFINE = '__SERVERPOD_OG_RENDER_FINGERPRINT__';
const TEST_RENDER_FINGERPRINT = 'render-fingerprint';

class TestDefinePlugin {
  static runtimeValue(fn, options) {
    return { fn, options };
  }

  constructor(definitions) {
    this.definitions = definitions;
  }
}

const CONFIGURE_WEBPACK_UTILS = {
  currentBundler: { instance: { DefinePlugin: TestDefinePlugin } },
};

function temporaryPlugin(t, { baseUrl = '/', siteDir = SITE_DIR } = {}) {
  const temporaryDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-plugin-')
  );
  t.after(() => fs.rmSync(temporaryDir, { recursive: true, force: true }));
  const generatedFilesDir = path.join(temporaryDir, 'generated');
  return {
    generatedFilesDir,
    outDir: path.join(temporaryDir, 'build'),
    plugin: openGraphImagesPlugin({
      siteDir,
      generatedFilesDir,
      baseUrl,
    }),
  };
}

function pluginFingerprint(plugin) {
  const config = plugin.configureWebpack(
    undefined,
    false,
    CONFIGURE_WEBPACK_UTILS
  );
  const runtimeValue = config.plugins[0].definitions[FINGERPRINT_DEFINE];
  const fingerprint = JSON.parse(runtimeValue.fn());
  assert.equal(runtimeValue.options.version, fingerprint);
  return fingerprint;
}

function doc({
  id,
  title = id,
  description = `${id} description`,
  frontMatter = {},
  sidebar = 'docs',
  permalink = `/${id}`,
  source = `@site/docs/${id}.md`,
}) {
  return { id, title, description, frontMatter, sidebar, permalink, source };
}

function docsContent(loadedVersions) {
  return {
    'docusaurus-plugin-content-docs': {
      default: { loadedVersions },
    },
  };
}

test('card IDs normalize whitespace only and produce safe public paths', () => {
  const id = cardId({
    title: '  Quickstart\n',
    description: 'Build\twith   Serverpod.',
    renderFingerprint: TEST_RENDER_FINGERPRINT,
  });
  assert.equal(
    id,
    cardId({
      title: 'Quickstart',
      description: 'Build with Serverpod.',
      renderFingerprint: TEST_RENDER_FINGERPRINT,
    })
  );
  assert.notEqual(
    id,
    cardId({
      title: '**Quickstart**',
      description: 'Build with Serverpod.',
      renderFingerprint: TEST_RENDER_FINGERPRINT,
    })
  );
  assert.match(id, /^[a-f0-9]{20}$/);
  assert.equal(cardPath(id), `/img/open-graph/${id}.jpg`);
  assert.equal(normalizeMetadata(' A\n\tB '), 'A B');
  assert.throws(
    () => cardId({ title: 'x', description: 'y' }),
    /render fingerprint is required/
  );
});

test('docs with empty titles get no generated card on either side', async (t) => {
  assert.equal(shouldGenerateCard({ title: 'Quickstart' }), true);
  assert.equal(shouldGenerateCard({ title: '' }), false);
  assert.equal(shouldGenerateCard({ title: '  \n ' }), false);

  assert.deepEqual(
    openGraphImageForDoc({
      title: '',
      description: 'Auto-extracted CLI reference text.',
      renderFingerprint: TEST_RENDER_FINGERPRINT,
    }),
    { generatedImage: undefined, image: undefined }
  );
  assert.deepEqual(
    openGraphImageForDoc({
      title: '',
      description: 'x',
      frontMatterImage: '/card.png',
      renderFingerprint: TEST_RENDER_FINGERPRINT,
    }),
    { generatedImage: undefined, image: '/card.png' }
  );

  const { generatedFilesDir, plugin } = temporaryPlugin(t);
  await plugin.allContentLoaded({
    allContent: docsContent([
      {
        versionName: 'current',
        sidebars: {},
        docs: [doc({ id: 'untitled', title: '' })],
      },
    ]),
  });
  assert.deepEqual(
    fs.readdirSync(path.join(generatedFilesDir, ASSET_DIRECTORY)),
    []
  );
});

test('cards generate across multiple docs plugin instances', async (t) => {
  const { generatedFilesDir, plugin } = temporaryPlugin(t);
  await plugin.allContentLoaded({
    allContent: {
      'docusaurus-plugin-content-docs': {
        default: {
          loadedVersions: [
            {
              versionName: 'current',
              sidebars: {},
              docs: [doc({ id: 'framework' })],
            },
          ],
        },
        cloud: {
          loadedVersions: [
            {
              versionName: 'current',
              sidebars: {},
              docs: [doc({ id: 'cloud' })],
            },
          ],
        },
      },
    },
  });
  const files = fs.readdirSync(path.join(generatedFilesDir, ASSET_DIRECTORY));
  assert.equal(files.length, 2);
});

test('explicit document images take precedence over generated cards', () => {
  const card = {
    title: 'Quickstart',
    description: 'Build with Serverpod.',
    renderFingerprint: TEST_RENDER_FINGERPRINT,
  };
  assert.deepEqual(
    openGraphImageForDoc({
      ...card,
      assetImage: '/assets/processed-card.png',
      frontMatterImage: './card.png',
    }),
    {
      generatedImage: undefined,
      image: '/assets/processed-card.png',
    }
  );
  assert.deepEqual(
    openGraphImageForDoc({ ...card, frontMatterImage: '/card.png' }),
    { generatedImage: undefined, image: '/card.png' }
  );

  const generated = openGraphImageForDoc(card);
  assert.equal(generated.image, generated.generatedImage);
  assert.match(generated.image, /^\/img\/open-graph\/[a-f0-9]{20}\.jpg$/);
});

test('dev serving respects baseUrl and watches every render asset', (t) => {
  const { plugin } = temporaryPlugin(t, { baseUrl: '/docs/' });
  const config = plugin.configureWebpack(
    undefined,
    false,
    CONFIGURE_WEBPACK_UTILS
  );
  assert.equal(config.devServer.static[0].publicPath, '/docs/img/open-graph');

  const runtimeValue = config.plugins[0].definitions[FINGERPRINT_DEFINE];
  assert.deepEqual(
    runtimeValue.options.fileDependencies,
    plugin.getPathsToWatch()
  );

  const watched = new Set(plugin.getPathsToWatch());
  assert.ok(
    watched.has(
      path.join(SITE_DIR, 'static', 'img', 'logo-horizontal-dark.svg')
    )
  );
  assert.ok(watched.has(path.join(__dirname, 'assets', 'doc-icon.png')));
  assert.ok(watched.has(path.join(__dirname, 'fonts', 'Inter-Regular.otf')));
  assert.ok(watched.has(path.join(__dirname, 'fonts', 'Inter-Black.otf')));
  assert.match(pluginFingerprint(plugin), /^[a-f0-9]{64}$/);
});

test('changing the logo invalidates the render fingerprint', (t) => {
  const temporaryDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-assets-')
  );
  t.after(() => fs.rmSync(temporaryDir, { recursive: true, force: true }));
  const staticImageDir = path.join(temporaryDir, 'static', 'img');
  fs.mkdirSync(staticImageDir, { recursive: true });
  fs.copyFileSync(
    path.join(SITE_DIR, 'static', 'img', 'logo-horizontal-dark.svg'),
    path.join(staticImageDir, 'logo-horizontal-dark.svg')
  );

  const plugin = openGraphImagesPlugin({
    siteDir: temporaryDir,
    generatedFilesDir: path.join(temporaryDir, 'generated'),
    baseUrl: '/',
  });
  const before = pluginFingerprint(plugin);
  fs.appendFileSync(
    path.join(staticImageDir, 'logo-horizontal-dark.svg'),
    '\n<!-- test-only change -->\n'
  );
  const after = pluginFingerprint(plugin);
  assert.notEqual(after, before);
});

test('changing the icon or a font invalidates the render fingerprint', (t) => {
  const temporaryDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-assets-')
  );
  t.after(() => fs.rmSync(temporaryDir, { recursive: true, force: true }));
  const staticImageDir = path.join(temporaryDir, 'static', 'img');
  fs.mkdirSync(staticImageDir, { recursive: true });
  fs.copyFileSync(
    path.join(SITE_DIR, 'static', 'img', 'logo-horizontal-dark.svg'),
    path.join(staticImageDir, 'logo-horizontal-dark.svg')
  );
  const iconPath = path.join(temporaryDir, 'doc-icon.png');
  const regularFontPath = path.join(temporaryDir, 'Inter-Regular.otf');
  fs.copyFileSync(path.join(__dirname, 'assets', 'doc-icon.png'), iconPath);
  fs.copyFileSync(
    path.join(__dirname, 'fonts', 'Inter-Regular.otf'),
    regularFontPath
  );

  const plugin = openGraphImagesPlugin(
    {
      siteDir: temporaryDir,
      generatedFilesDir: path.join(temporaryDir, 'generated'),
      baseUrl: '/',
    },
    { iconPath, regularFontPath }
  );
  const initial = pluginFingerprint(plugin);
  fs.appendFileSync(iconPath, Buffer.from([0]));
  const afterIcon = pluginFingerprint(plugin);
  assert.notEqual(afterIcon, initial);
  fs.appendFileSync(regularFontPath, Buffer.from([0]));
  assert.notEqual(pluginFingerprint(plugin), afterIcon);
});

test('plugin and theme derivation share IDs without global manifest data', async (t) => {
  const { generatedFilesDir, outDir, plugin } = temporaryPlugin(t);
  const generatedDir = path.join(generatedFilesDir, ASSET_DIRECTORY);
  fs.mkdirSync(generatedDir, { recursive: true });
  const staleId = '00000000000000000000';
  fs.writeFileSync(path.join(generatedDir, `${staleId}.jpg`), 'stale');
  let globalDataCalls = 0;

  const quickstart = doc({
    id: 'quickstart',
    title: 'Quickstart',
    description: 'Create and run a Serverpod project.',
  });
  await plugin.allContentLoaded({
    allContent: docsContent([
      {
        versionName: 'current',
        sidebars: {},
        docs: [
          quickstart,
          doc({
            id: 'custom-card',
            frontMatter: { image: '/img/custom.jpg' },
          }),
        ],
      },
    ]),
    actions: {
      setGlobalData() {
        globalDataCalls += 1;
      },
    },
  });

  const expectedId = cardId({
    title: quickstart.title,
    description: quickstart.description,
    renderFingerprint: pluginFingerprint(plugin),
  });
  assert.equal(globalDataCalls, 0);
  assert.ok(fs.existsSync(path.join(generatedDir, `${expectedId}.jpg`)));
  assert.equal(fs.existsSync(path.join(generatedDir, `${staleId}.jpg`)), false);

  assert.equal(plugin.postBuild({ outDir }), undefined);
  assert.deepEqual(fs.readdirSync(path.join(outDir, 'img', 'open-graph')), [
    `${expectedId}.jpg`,
  ]);
  assert.equal(plugin.postBuild({ outDir }), undefined);
  assert.deepEqual(fs.readdirSync(path.join(outDir, 'img', 'open-graph')), [
    `${expectedId}.jpg`,
  ]);
});

test('serializes reloads and cleans only stale temporary files', async (t) => {
  const { generatedFilesDir, plugin } = temporaryPlugin(t);
  const generatedDir = path.join(generatedFilesDir, ASSET_DIRECTORY);
  fs.mkdirSync(generatedDir, { recursive: true });
  const staleTemporaryFileName =
    '00000000000000000000.jpg.123.00000000-0000-0000-0000-000000000000.tmp';
  const activeTemporaryFileName =
    '11111111111111111111.jpg.456.11111111-1111-1111-1111-111111111111.tmp';
  const staleTemporaryPath = path.join(generatedDir, staleTemporaryFileName);
  fs.writeFileSync(staleTemporaryPath, 'abandoned');
  fs.utimesSync(staleTemporaryPath, new Date(0), new Date(0));
  fs.writeFileSync(
    path.join(generatedDir, activeTemporaryFileName),
    'still active'
  );

  const renderOneCard = plugin.allContentLoaded({
    allContent: docsContent([
      {
        versionName: 'current',
        sidebars: {},
        docs: [doc({ id: 'first' })],
      },
    ]),
  });
  const removeAllCards = plugin.allContentLoaded({
    allContent: docsContent([]),
  });

  await Promise.all([renderOneCard, removeAllCards]);
  assert.deepEqual(fs.readdirSync(generatedDir), [activeTemporaryFileName]);
});

test('drains render workers and recovers after a render failure', async (t) => {
  const { generatedFilesDir, plugin } = temporaryPlugin(t);
  const generatedDir = path.join(generatedFilesDir, ASSET_DIRECTORY);
  const docs = Array.from({ length: 8 }, (_, index) =>
    doc({
      id: `failure-${index}`,
      title: index === 0 ? 'Launch 🚀' : `Valid card ${index}`,
    })
  );

  await assert.rejects(
    plugin.allContentLoaded({
      allContent: docsContent([
        {
          versionName: 'current',
          sidebars: {},
          docs,
        },
      ]),
    }),
    (error) => {
      assert.match(
        error.message,
        /^Card for "Launch 🚀" \(@site\/docs\/failure-0\.md\): Open Graph title contains unsupported .*U\+1F680/
      );
      assert.ok(error.cause instanceof Error);
      assert.match(
        error.cause.message,
        /^Open Graph title contains unsupported .*U\+1F680/
      );
      return true;
    }
  );

  assert.equal(
    fs.readdirSync(generatedDir).some((fileName) => fileName.endsWith('.tmp')),
    false
  );
  await plugin.allContentLoaded({ allContent: docsContent([]) });
  assert.deepEqual(fs.readdirSync(generatedDir), []);
});

test('archived framework versions render', async (t) => {
  const { generatedFilesDir, plugin } = temporaryPlugin(t);

  await plugin.allContentLoaded({
    allContent: docsContent([
      {
        versionName: '1.0.0',
        isLast: false,
        sidebars: {},
        docs: [doc({ id: 'archived', permalink: '/1.0.0/archived' })],
      },
    ]),
  });

  const files = fs.readdirSync(path.join(generatedFilesDir, ASSET_DIRECTORY));
  assert.equal(files.length, 1);
  assert.match(files[0], /^[a-f0-9]{20}\.jpg$/);
});

test('all-explicit content produces zero cards and copies nothing', async (t) => {
  const { generatedFilesDir, outDir, plugin } = temporaryPlugin(t);
  const generatedDir = path.join(generatedFilesDir, ASSET_DIRECTORY);
  const outputDir = path.join(outDir, 'img', 'open-graph');
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(generatedDir, '11111111111111111111.jpg'),
    'cached'
  );
  fs.writeFileSync(path.join(outputDir, 'custom.jpg'), 'explicit image');

  await plugin.allContentLoaded({
    allContent: docsContent([
      {
        versionName: 'current',
        sidebars: {},
        docs: [
          doc({
            id: 'explicit',
            frontMatter: { image: 'https://example.com/card.jpg' },
          }),
        ],
      },
    ]),
  });

  assert.equal(plugin.postBuild({ outDir }), undefined);
  assert.deepEqual(fs.readdirSync(outputDir), ['custom.jpg']);
  assert.deepEqual(fs.readdirSync(generatedDir), []);
});
