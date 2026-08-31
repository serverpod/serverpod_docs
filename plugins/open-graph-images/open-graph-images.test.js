const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const openGraphImagesPlugin = require('./index');
const {
  ICON_FILE_BY_CLASS,
  OG_ICON_FILE_BY_CLASS,
  cardIdentityForDoc,
  cardPath,
  normalizeMetadata,
  openGraphImageForDoc,
  publicPathWithBaseUrl,
} = require('./shared');

const SITE_DIR = path.resolve(__dirname, '..', '..');
const PLUGIN_NAME = 'serverpod-open-graph-images';
const ASSET_DIRECTORY = `${PLUGIN_NAME}-assets`;
const FINGERPRINT_DEFINE = '__SERVERPOD_OG_RENDER_FINGERPRINTS_BY_ICON__';
const OPEN_GRAPH_ICON_FILE_NAMES = Object.freeze([
  ...new Set(Object.values(OG_ICON_FILE_BY_CLASS)),
]);
const TEST_RENDER_FINGERPRINTS = Object.freeze(
  Object.fromEntries(
    OPEN_GRAPH_ICON_FILE_NAMES.map((fileName) => [
      fileName,
      'render-fingerprint',
    ])
  )
);

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

function temporaryPlugin(t, { baseUrl = '/' } = {}) {
  const temporaryDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-plugin-')
  );
  t.after(() => fs.rmSync(temporaryDir, { recursive: true, force: true }));
  const generatedFilesDir = path.join(temporaryDir, 'generated');
  return {
    generatedFilesDir,
    outDir: path.join(temporaryDir, 'build'),
    plugin: openGraphImagesPlugin({
      siteDir: SITE_DIR,
      generatedFilesDir,
      baseUrl,
    }),
  };
}

function pluginFingerprints(plugin) {
  const config = plugin.configureWebpack(
    undefined,
    false,
    CONFIGURE_WEBPACK_UTILS
  );
  const runtimeValue = config.plugins[0].definitions[FINGERPRINT_DEFINE];
  return JSON.parse(runtimeValue.fn());
}

function doc({
  id,
  title = id,
  description = `${id} description`,
  frontMatter = {},
  sidebar = 'docs',
  permalink = `/${id}`,
}) {
  return { id, title, description, frontMatter, sidebar, permalink };
}

function docsContent(loadedVersions) {
  return {
    'docusaurus-plugin-content-docs': {
      default: { loadedVersions },
    },
  };
}

test('raw and client sidebars resolve the same nearest category icons', () => {
  const rawSidebar = [
    {
      type: 'category',
      className: 'menu-class sidebar-icon-getting-started',
      items: [
        {
          type: 'doc',
          id: 'quickstart',
          className: 'sidebar-icon-quickstart',
        },
        {
          type: 'category',
          className: 'sidebar-icon-tools',
          items: [{ type: 'ref', id: 'nested' }],
        },
      ],
    },
    {
      type: 'category',
      className: 'sidebar-icon-overview',
      link: { type: 'doc', id: 'introduction' },
      items: [],
    },
  ];
  const clientSidebar = [
    {
      type: 'category',
      className: 'menu-class sidebar-icon-getting-started',
      items: [
        {
          type: 'link',
          docId: 'quickstart',
          href: '/quickstart',
          className: 'sidebar-icon-quickstart',
        },
        {
          type: 'category',
          className: 'sidebar-icon-tools',
          items: [{ type: 'link', docId: 'nested', href: '/nested' }],
        },
      ],
    },
    {
      type: 'category',
      className: 'sidebar-icon-overview',
      href: '/introduction/',
      items: [],
    },
  ];

  for (const [id, permalink, expected] of [
    ['quickstart', '/quickstart', 'sidebar-icon-quickstart'],
    ['nested', '/nested', 'sidebar-icon-tools'],
    ['introduction', '/introduction', 'sidebar-icon-overview'],
  ]) {
    const common = {
      title: id,
      description: `${id} description`,
      docId: id,
      permalink,
      renderFingerprintByIconFileName: TEST_RENDER_FINGERPRINTS,
    };
    const rawIdentity = cardIdentityForDoc({
      ...common,
      sidebarItems: rawSidebar,
    });
    const clientIdentity = cardIdentityForDoc({
      ...common,
      sidebarItems: clientSidebar,
    });
    assert.equal(rawIdentity.iconFileName, ICON_FILE_BY_CLASS[expected]);
    assert.deepEqual(clientIdentity, rawIdentity);
  }
});

test('icon lookup is safe and direct page icons take precedence', () => {
  const common = {
    title: 'Quickstart',
    description: 'Create a Serverpod project.',
    docId: 'quickstart',
    permalink: '/quickstart',
    sidebarItems: [],
    renderFingerprintByIconFileName: TEST_RENDER_FINGERPRINTS,
  };
  assert.equal(
    cardIdentityForDoc({
      ...common,
      directClassName: 'toString constructor',
    }).iconFileName,
    ICON_FILE_BY_CLASS['sidebar-icon-reference']
  );
  assert.equal(
    cardIdentityForDoc({
      ...common,
      directClassName: 'sidebar-icon-quickstart',
    }).iconFileName,
    ICON_FILE_BY_CLASS['sidebar-icon-quickstart']
  );
});

test('numbered sidebar steps use standalone semantic icons', () => {
  const common = {
    title: 'Build your first app',
    description: 'Complete one step of the tutorial.',
    docId: 'step',
    permalink: '/step',
    sidebarItems: [],
    renderFingerprintByIconFileName: TEST_RENDER_FINGERPRINTS,
  };
  const expectedByClass = {
    'sidebar-icon-get-started-step-1': 'sidebar-icon-server.svg',
    'sidebar-icon-get-started-step-2': 'sidebar-icon-layers.svg',
    'sidebar-icon-get-started-step-3': 'sidebar-icon-database.svg',
    'sidebar-icon-get-started-step-4': 'sidebar-icon-rocket.svg',
  };

  for (const [directClassName, expectedFileName] of Object.entries(
    expectedByClass
  )) {
    assert.equal(
      cardIdentityForDoc({ ...common, directClassName }).iconFileName,
      expectedFileName
    );
  }
});

test('icon mappings match the sidebar CSS and point to existing SVGs', () => {
  const css = fs.readFileSync(
    path.join(SITE_DIR, 'src', 'css', 'custom.css'),
    'utf8'
  );
  const cssMappings = new Map();
  const iconRule =
    /([^{}]+)\{[^{}]*--sidebar-icon-mask:\s*url\('\/img\/([^']+)'\);/g;

  for (const match of css.matchAll(iconRule)) {
    const [, selectors, fileName] = match;
    for (const classMatch of selectors.matchAll(
      /\.(sidebar-(?:icon-[\w-]+|installation-icon|introduction-icon))/g
    )) {
      cssMappings.set(classMatch[1], fileName);
    }
  }

  assert.deepEqual(
    Object.fromEntries([...cssMappings].sort()),
    Object.fromEntries(Object.entries(ICON_FILE_BY_CLASS).sort())
  );
  for (const fileName of new Set(Object.values(ICON_FILE_BY_CLASS))) {
    const filePath = path.join(SITE_DIR, 'static', 'img', fileName);
    assert.ok(fs.existsSync(filePath));
    assert.match(fs.readFileSync(filePath, 'utf8'), /currentColor/);
  }
  for (const fileName of OPEN_GRAPH_ICON_FILE_NAMES) {
    const filePath = path.join(SITE_DIR, 'static', 'img', fileName);
    assert.ok(fs.existsSync(filePath));
    assert.match(fs.readFileSync(filePath, 'utf8'), /currentColor/);
  }
});

test('card IDs normalize whitespace only and produce safe public paths', () => {
  const common = {
    docId: 'quickstart',
    permalink: '/quickstart',
    directClassName: 'sidebar-icon-quickstart',
    sidebarItems: [],
    renderFingerprintByIconFileName: TEST_RENDER_FINGERPRINTS,
  };
  const id = cardIdentityForDoc({
    ...common,
    title: '  Quickstart\n',
    description: 'Build\twith   Serverpod.',
  }).id;
  assert.equal(
    id,
    cardIdentityForDoc({
      ...common,
      title: 'Quickstart',
      description: 'Build with Serverpod.',
    }).id
  );
  assert.notEqual(
    id,
    cardIdentityForDoc({
      ...common,
      title: '**Quickstart**',
      description: 'Build with Serverpod.',
    }).id
  );
  assert.match(id, /^[a-f0-9]{20}$/);
  assert.equal(cardPath(id), `/img/open-graph/${id}.jpg`);
  assert.equal(normalizeMetadata(' A\n\tB '), 'A B');
});

test('explicit document images take precedence over generated cards', () => {
  const card = {
    title: 'Quickstart',
    description: 'Build with Serverpod.',
    docId: 'quickstart',
    permalink: '/quickstart',
    sidebarItems: [],
    renderFingerprintByIconFileName: TEST_RENDER_FINGERPRINTS,
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
  assert.equal(publicPathWithBaseUrl('/docs/'), '/docs/img/open-graph');

  const watched = new Set(plugin.getPathsToWatch());
  assert.ok(
    watched.has(
      path.join(SITE_DIR, 'static', 'img', 'logo-horizontal-dark.svg')
    )
  );
  for (const fileName of OPEN_GRAPH_ICON_FILE_NAMES) {
    assert.ok(watched.has(path.join(SITE_DIR, 'static', 'img', fileName)));
  }
  const fingerprints = pluginFingerprints(plugin);
  assert.deepEqual(
    Object.keys(fingerprints).sort(),
    [...OPEN_GRAPH_ICON_FILE_NAMES].sort()
  );
  for (const fingerprint of Object.values(fingerprints)) {
    assert.match(fingerprint, /^[a-f0-9]{64}$/);
  }
});

test('changing one icon invalidates only cards that use that icon', (t) => {
  const temporaryDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverpod-og-assets-')
  );
  t.after(() => fs.rmSync(temporaryDir, { recursive: true, force: true }));
  const staticImageDir = path.join(temporaryDir, 'static', 'img');
  fs.mkdirSync(staticImageDir, { recursive: true });
  const assetFileNames = [
    'logo-horizontal-dark.svg',
    ...OPEN_GRAPH_ICON_FILE_NAMES,
  ];
  for (const fileName of assetFileNames) {
    fs.copyFileSync(
      path.join(SITE_DIR, 'static', 'img', fileName),
      path.join(staticImageDir, fileName)
    );
  }

  const plugin = openGraphImagesPlugin({
    siteDir: temporaryDir,
    generatedFilesDir: path.join(temporaryDir, 'generated'),
    baseUrl: '/',
  });
  const before = pluginFingerprints(plugin);
  const changedIcon = OPEN_GRAPH_ICON_FILE_NAMES[0];
  fs.appendFileSync(
    path.join(staticImageDir, changedIcon),
    '\n<!-- test-only change -->\n'
  );
  const after = pluginFingerprints(plugin);

  for (const fileName of Object.keys(before)) {
    if (fileName === changedIcon) {
      assert.notEqual(after[fileName], before[fileName]);
    } else {
      assert.equal(after[fileName], before[fileName]);
    }
  }
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
        sidebars: {
          ignored: [
            {
              type: 'category',
              className: 'sidebar-icon-tools',
              items: [{ type: 'doc', id: 'quickstart' }],
            },
          ],
          docs: [
            {
              type: 'category',
              className: 'sidebar-icon-getting-started',
              items: [
                { type: 'doc', id: 'quickstart' },
                { type: 'doc', id: 'custom-card' },
              ],
            },
          ],
        },
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

  const expectedId = cardIdentityForDoc({
    title: quickstart.title,
    description: quickstart.description,
    docId: quickstart.id,
    permalink: quickstart.permalink,
    directClassName: quickstart.frontMatter.sidebar_class_name,
    sidebarItems: [
      {
        type: 'category',
        className: 'sidebar-icon-getting-started',
        items: [{ type: 'doc', id: 'quickstart' }],
      },
    ],
    renderFingerprintByIconFileName: pluginFingerprints(plugin),
  }).id;
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
        sidebars: { docs: [{ type: 'doc', id: 'first' }] },
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
          sidebars: { docs: docs.map(({ id }) => ({ type: 'doc', id })) },
          docs,
        },
      ]),
    }),
    /Open Graph title contains unsupported .*U\+1F680/
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
        sidebars: {
          docs: [
            {
              type: 'category',
              className: 'sidebar-icon-reference',
              items: [{ type: 'doc', id: 'archived' }],
            },
          ],
        },
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
        sidebars: { docs: [{ type: 'doc', id: 'explicit' }] },
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
