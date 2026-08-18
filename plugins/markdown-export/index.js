// Docusaurus plugin that publishes a clean markdown version of every doc page
// at its page URL with `.md` appended, plus llms.txt and per-instance
// llms-full.txt discovery files at the site root.
//
// Files are generated during `allContentLoaded` (which runs after every
// plugin's `loadContent`, so snipsync has finished mutating sources by then)
// and copied into the build output during `postBuild`. In dev, the generated
// directory is served through the dev server's static file handling, so
// `.md` URLs resolve the same way they do in production.

const fs = require('fs');
const path = require('path');
const { aliasedSitePathToRelativePath } = require('@docusaurus/utils');

const { flattenDoc } = require('./flatten');
const { buildLlmsTxt, buildLlmsFullTxt } = require('./llms');
const { normalizePermalink, mdFilePath, mdUrl } = require('./urls');

const PLUGIN_NAME = 'serverpod-markdown-export';
const DOCS_PLUGIN = 'docusaurus-plugin-content-docs';
const REDIRECTS_PLUGIN = '@docusaurus/plugin-client-redirects';

/** Collect doc ids in sidebar order; docs order for anything unlisted. */
function sidebarOrderedDocs(version) {
  const orderedIds = [];
  const walk = (items) => {
    for (const item of items || []) {
      if (item.type === 'doc' || item.type === 'ref') {
        orderedIds.push(item.id);
      } else if (item.type === 'category') {
        if (item.link && item.link.type === 'doc') {
          orderedIds.push(item.link.id);
        }
        walk(item.items);
      }
    }
  };
  for (const sidebar of Object.values(version.sidebars || {})) {
    walk(sidebar);
  }
  const byId = new Map(version.docs.map((d) => [d.id, d]));
  const ordered = [];
  const seen = new Set();
  for (const id of orderedIds) {
    const doc = byId.get(id);
    if (doc && !seen.has(doc.permalink)) {
      seen.add(doc.permalink);
      ordered.push(doc);
    }
  }
  for (const doc of version.docs) {
    if (!seen.has(doc.permalink)) {
      seen.add(doc.permalink);
      ordered.push(doc);
    }
  }
  return ordered;
}

/** Extract the client-redirects source→target pairs from the site config. */
function redirectPairs(siteConfig) {
  const entry = (siteConfig.plugins || []).find(
    (p) => Array.isArray(p) && p[0] === REDIRECTS_PLUGIN
  );
  if (!entry || !entry[1] || !Array.isArray(entry[1].redirects)) {
    // Fail hard: silently emitting zero stubs would pass CI vacuously.
    throw new Error(
      `${PLUGIN_NAME}: could not find the ${REDIRECTS_PLUGIN} config; ` +
        'the "moved to" stubs derive from it.'
    );
  }
  const pairs = [];
  for (const rule of entry[1].redirects) {
    const froms = Array.isArray(rule.from) ? rule.from : [rule.from];
    for (const from of froms) {
      pairs.push({ from, to: rule.to });
    }
  }
  return pairs;
}

// Per-source flatten cache, keyed by mtime, so a dev reload (which re-runs
// allContentLoaded for every content edit) only re-flattens changed files.
// Pages that inline partials are always re-flattened: their output depends
// on the partials' files too, and there are only a few dozen of them.
const flattenCache = new Map();

async function flattenWithCache(descriptor, sourcePath, shared) {
  const mtimeMs = fs.statSync(sourcePath).mtimeMs;
  const cached = flattenCache.get(sourcePath);
  if (cached && cached.mtimeMs === mtimeMs && !cached.result.usedPartials) {
    return cached.result;
  }
  const result = await flattenDoc(descriptor, sourcePath, shared);
  flattenCache.set(sourcePath, { mtimeMs, result });
  return result;
}

module.exports = function markdownExportPlugin(context) {
  const genDir = path.join(context.generatedFilesDir, PLUGIN_NAME);
  const manifestPath = path.join(
    context.generatedFilesDir,
    'markdown-export-manifest.json'
  );
  let firstRun = true;

  return {
    name: PLUGIN_NAME,

    async allContentLoaded({ allContent }) {
      const startedAt = Date.now();
      const isDev = process.env.NODE_ENV !== 'production';
      const instances = allContent[DOCS_PLUGIN] || {};

      const frameworkStable = (instances.default?.loadedVersions || []).find(
        (v) => v.isLast
      );
      const cloudVersions = instances.cloud?.loadedVersions || [];
      const cloudCurrent = cloudVersions.find((v) => v.isLast) || cloudVersions[0];
      if (!frameworkStable || !cloudCurrent) {
        // Fail hard: an empty llms selection would otherwise ship silently.
        throw new Error(
          `${PLUGIN_NAME}: could not resolve the stable framework version ` +
            'or the cloud docs instance for the llms files.'
        );
      }

      // Pass 1: index every doc of every instance and version, so link
      // rewriting can map any source file or route to its permalink. Docs
      // are carried as lightweight descriptors with normalized permalinks;
      // the loaded content objects are never mutated. In dev, archived
      // framework versions are indexed but not rendered: a content edit
      // re-runs this whole hook, and re-flattening 18 immutable trees per
      // keystroke would stall the reload.
      const docs = [];
      const sourceToPermalink = new Map();
      const permalinks = new Set();
      for (const [instanceId, content] of Object.entries(instances)) {
        for (const version of content.loadedVersions) {
          const render =
            !isDev ||
            instanceId !== 'default' ||
            version.isLast ||
            version.versionName === 'current';
          for (const doc of version.docs) {
            const sourcePath = path.join(
              context.siteDir,
              aliasedSitePathToRelativePath(doc.source)
            );
            const permalink = normalizePermalink(doc.permalink);
            docs.push({
              descriptor: { id: doc.id, title: doc.title, permalink },
              sourcePath,
              render,
            });
            sourceToPermalink.set(sourcePath, permalink);
            permalinks.add(permalink);
          }
        }
      }

      // The llms files only need the rendered markdown of current stable and
      // Cloud pages; everything else streams straight to disk.
      const llmsPermalinks = new Set(
        [...frameworkStable.docs, ...cloudCurrent.docs].map((d) =>
          normalizePermalink(d.permalink)
        )
      );

      // Pass 2: flatten and write, mirrored by permalink. The gen dir is
      // only wiped on the first run; dev reloads overwrite in place so the
      // dev server never serves from a half-empty directory.
      if (firstRun) {
        fs.rmSync(genDir, { recursive: true, force: true });
        firstRun = false;
      }
      fs.mkdirSync(genDir, { recursive: true });
      const rendered = new Map(); // llms permalink -> markdown
      const titles = new Map(); // llms permalink -> title
      const createdDirs = new Set();
      const shared = {
        siteDir: context.siteDir,
        sourceToPermalink,
        permalinks,
        droppedJsx: new Map(),
      };
      let written = 0;
      for (const entry of docs) {
        if (!entry.render) {
          continue;
        }
        const { title, markdown } = await flattenWithCache(
          entry.descriptor,
          entry.sourcePath,
          shared
        );
        const permalink = entry.descriptor.permalink;
        if (llmsPermalinks.has(permalink)) {
          rendered.set(permalink, markdown);
          titles.set(permalink, title);
        }
        const outFile = path.join(genDir, mdFilePath(permalink));
        const outDirName = path.dirname(outFile);
        if (!createdDirs.has(outDirName)) {
          fs.mkdirSync(outDirName, { recursive: true });
          createdDirs.add(outDirName);
        }
        fs.writeFileSync(outFile, markdown);
        written += 1;
      }

      if (shared.droppedJsx.size > 0) {
        const summary = [...shared.droppedJsx.entries()]
          .map(([name, count]) => `<${name}> x${count}`)
          .join(', ');
        console.warn(
          `[${PLUGIN_NAME}] Dropped childless JSX with no markdown mapping: ` +
            `${summary}. Add a rule in flatten.js if the content matters.`
        );
      }

      const toDescriptor = (doc) => {
        const permalink = normalizePermalink(doc.permalink);
        return {
          id: doc.id,
          title: titles.get(permalink) || doc.title || doc.id,
          description: doc.description,
          permalink,
        };
      };
      const frameworkDocs = sidebarOrderedDocs(frameworkStable).map(toDescriptor);
      const cloudDocs = sidebarOrderedDocs(cloudCurrent).map(toDescriptor);

      fs.writeFileSync(
        path.join(genDir, 'llms.txt'),
        buildLlmsTxt({ frameworkDocs, cloudDocs })
      );
      fs.writeFileSync(
        path.join(genDir, 'llms-full.txt'),
        buildLlmsFullTxt({
          title: 'Serverpod framework documentation',
          summary:
            'The current stable Serverpod framework documentation as a single ' +
            'markdown file. Every page starts with its title and canonical URL.',
          docs: frameworkDocs,
          rendered,
        })
      );
      fs.mkdirSync(path.join(genDir, 'cloud'), { recursive: true });
      fs.writeFileSync(
        path.join(genDir, 'cloud', 'llms-full.txt'),
        buildLlmsFullTxt({
          title: 'Serverpod Cloud documentation',
          summary:
            'The Serverpod Cloud documentation as a single markdown file. ' +
            'Every page starts with its title and canonical URL.',
          docs: cloudDocs,
          rendered,
        })
      );

      // "Moved to" stubs so previously copied .md URLs survive renames.
      // Skip any source a real page owns.
      const stubs = [];
      for (const pair of redirectPairs(context.siteConfig)) {
        const from = normalizePermalink(pair.from);
        const to = normalizePermalink(pair.to);
        if (permalinks.has(from)) {
          continue;
        }
        const stubFile = path.join(genDir, mdFilePath(from));
        fs.mkdirSync(path.dirname(stubFile), { recursive: true });
        fs.writeFileSync(stubFile, `Moved to ${mdUrl(to)}\n`);
        stubs.push(from);
      }

      // Manifest for the CI verification script. Written outside genDir so
      // the postBuild copy never publishes it.
      fs.writeFileSync(
        manifestPath,
        JSON.stringify({ pages: docs.map((d) => d.descriptor.permalink).sort(), stubs: stubs.sort() }, null, 2)
      );

      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(
        `[${PLUGIN_NAME}] Generated ${written} markdown pages, ` +
          `${stubs.length} redirect stubs, and the llms files in ${seconds}s.`
      );
    },

    configureWebpack() {
      // Serves the generated .md files in dev. Must stay a one-element
      // array: webpack-merge concatenates arrays but would let an object
      // replace Docusaurus's own static-directory array.
      return {
        devServer: {
          static: [
            {
              directory: genDir,
              publicPath: context.baseUrl,
              // The export rewrites every page on each rebuild; watching
              // the directory would force a full reload on top of each edit.
              watch: false,
            },
          ],
        },
      };
    },

    async postBuild({ outDir }) {
      // errorOnExist makes a collision with static/ assets or another
      // plugin's output a loud failure instead of a silent overwrite.
      fs.cpSync(genDir, outDir, {
        recursive: true,
        force: false,
        errorOnExist: true,
      });
    },
  };
};
