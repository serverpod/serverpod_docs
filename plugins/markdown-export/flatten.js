// Flattens a doc's MDX/markdown source into clean, self-contained markdown:
// partial imports inlined, Tabs unwrapped, video embeds turned into links,
// snipsync markers and HTML comments stripped, and links rewritten to
// absolute URLs.
//
// Front matter and titles go through @docusaurus/utils so this pipeline
// parses sources exactly the way the site build does. The remark toolchain
// is ESM-only, so it is loaded through dynamic import from this CommonJS
// module.

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_PARSE_FRONT_MATTER,
  escapeMarkdownHeadingIds,
  parseMarkdownContentTitle,
} = require('@docusaurus/utils');

const urls = require('./urls');

let toolchainPromise;
function toolchain() {
  if (!toolchainPromise) {
    toolchainPromise = (async () => {
      const [
        {unified},
        {default: remarkParse},
        {default: remarkStringify},
        {default: remarkMdx},
        {default: remarkGfm},
      ] = await Promise.all([
        import('unified'),
        import('remark-parse'),
        import('remark-stringify'),
        import('remark-mdx'),
        import('remark-gfm'),
      ]);
      return {
        mdxParser: unified().use(remarkParse).use(remarkMdx).use(remarkGfm),
        mdParser: unified().use(remarkParse).use(remarkGfm),
        stringifier: unified().use(remarkGfm).use(remarkStringify, {
          bullet: '-',
          fences: true,
          resourceLink: true,
        }),
      };
    })();
  }
  return toolchainPromise;
}

const IMPORT_RE = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;

/**
 * Trim whitespace at the edges of a node list, so unwrapped JSX like
 * `<summary> Click…</summary>` does not serialize an escaped leading space.
 */
function trimTextEdges(nodes) {
  const first = nodes[0];
  if (first && first.type === 'text') {
    first.value = first.value.replace(/^\s+/, '');
  }
  const last = nodes[nodes.length - 1];
  if (last && last.type === 'text') {
    last.value = last.value.replace(/\s+$/, '');
  }
}

function jsxAttr(node, name) {
  for (const attr of node.attributes || []) {
    if (attr.type === 'mdxJsxAttribute' && attr.name === name && typeof attr.value === 'string') {
      return attr.value;
    }
  }
  return undefined;
}

function textOf(node) {
  if (node.type === 'text' || node.type === 'inlineCode') {
    return node.value;
  }
  return (node.children || []).map(textOf).join('');
}

function splitAnchor(url) {
  const hash = url.indexOf('#');
  if (hash === -1) {
    return { target: url, anchor: '' };
  }
  return { target: url.slice(0, hash), anchor: url.slice(hash) };
}

function isExternal(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
}

/** Resolve an import/link source spec to an absolute file path. */
function resolveSourcePath(spec, fileDir, siteDir) {
  if (spec.startsWith('@site/')) {
    return path.join(siteDir, spec.slice('@site/'.length));
  }
  return path.resolve(fileDir, spec);
}

/**
 * Rewrite a file-style link (ending .md/.mdx) found in `filePath` to an
 * absolute .md URL, using the source-to-permalink map. Unknown targets pass
 * through and surface later as broken absolute links in the CI link check.
 */
function rewriteFileLink(url, filePath, shared) {
  const { target, anchor } = splitAnchor(url);
  if (!/\.(md|mdx)$/.test(target) || isExternal(target)) {
    return url;
  }
  if (target.startsWith('/') || (target.startsWith('@') && !target.startsWith('@site/'))) {
    return url;
  }
  const resolved = resolveSourcePath(target, path.dirname(filePath), shared.siteDir);
  const permalink = shared.sourceToPermalink.get(resolved);
  if (!permalink) {
    return url;
  }
  return `${urls.mdUrl(permalink)}${anchor}`;
}

/**
 * Remove HTML comments outside fenced code blocks (the MDX loader does the
 * same before compiling; this also strips the snipsync markers). Comments
 * inside code fences are sample code and stay untouched.
 */
function stripHtmlComments(content) {
  const out = [];
  let inFence = false;
  let inComment = false;
  for (let line of content.split('\n')) {
    if (inFence) {
      out.push(line);
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = false;
      }
      continue;
    }
    if (inComment) {
      const close = line.indexOf('-->');
      if (close === -1) {
        continue;
      }
      line = line.slice(close + 3);
      inComment = false;
    }
    line = line.replace(/<!--[\s\S]*?-->/g, '');
    const open = line.indexOf('<!--');
    if (open !== -1) {
      line = line.slice(0, open);
      inComment = true;
    }
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = true;
    }
    out.push(line);
  }
  return out.join('\n');
}

/**
 * Parse markdown/MDX body text into an mdast tree, mirroring how the site
 * compiles: comments stripped and heading IDs escaped first (so `{#id}`
 * anchors survive into the output text), CommonMark as the .md fallback.
 */
async function parseBody(filePath, body) {
  const { mdxParser, mdParser } = await toolchain();
  const prepared = stripHtmlComments(escapeMarkdownHeadingIds(body));
  try {
    return mdxParser.parse(prepared);
  } catch (mdxError) {
    if (filePath.endsWith('.mdx')) {
      throw new Error(`Failed to parse ${filePath}: ${mdxError.message}`);
    }
    return mdParser.parse(prepared);
  }
}

/**
 * Recursively transform a node list: drop imports/expressions, inline
 * partials, unwrap JSX, rewrite file-style links. Unknown childless JSX is
 * recorded on shared.droppedJsx: deleting a node that carries its meaning in
 * attributes must be a visible decision, never a silent default.
 */
async function transformNodes(nodes, ctx) {
  const out = [];
  for (const node of nodes || []) {
    switch (node.type) {
      case 'mdxjsEsm': {
        for (const match of node.value.matchAll(IMPORT_RE)) {
          const [, name, source] = match;
          if (/\.(md|mdx)$/.test(source) && (!source.startsWith('@') || source.startsWith('@site/'))) {
            ctx.imports.set(name, resolveSourcePath(source, ctx.dir, ctx.shared.siteDir));
          }
        }
        break;
      }
      case 'mdxFlowExpression':
      case 'mdxTextExpression':
        break;
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement': {
        const partialPath = node.name ? ctx.imports.get(node.name) : undefined;
        if (partialPath) {
          out.push(...(await flattenPartial(partialPath, ctx.shared, ctx.stack)));
        } else if (node.name === 'TabItem') {
          const label = jsxAttr(node, 'label') || jsxAttr(node, 'value');
          if (label) {
            out.push({
              type: 'paragraph',
              children: [{ type: 'strong', children: [{ type: 'text', value: label }] }],
            });
          }
          out.push(...(await transformNodes(node.children, ctx)));
        } else if (node.name === 'ReactPlayer' || node.name === 'iframe' || node.name === 'video') {
          const url = jsxAttr(node, 'url') || jsxAttr(node, 'src');
          if (url) {
            out.push({
              type: 'paragraph',
              children: [
                { type: 'link', url, children: [{ type: 'text', value: 'Watch the video' }] },
              ],
            });
          }
        } else if (node.name === 'img') {
          const src = jsxAttr(node, 'src');
          if (src) {
            out.push({ type: 'image', url: src, alt: jsxAttr(node, 'alt') || '' });
          }
        } else if (node.name === 'br') {
          // Dropping a void <br/> outright fuses the words around it.
          out.push({ type: 'text', value: ' ' });
        } else {
          // Tabs and any other JSX wrapper: keep the content, drop the tag.
          const kids = await transformNodes(node.children, ctx);
          if (kids.length === 0 && (node.children || []).length === 0 && node.name) {
            const count = ctx.shared.droppedJsx.get(node.name) || 0;
            ctx.shared.droppedJsx.set(node.name, count + 1);
          }
          if (node.type === 'mdxJsxFlowElement') {
            trimTextEdges(kids);
          }
          out.push(...kids);
        }
        break;
      }
      default: {
        if (node.type === 'link' || node.type === 'definition') {
          node.url = rewriteFileLink(node.url, ctx.filePath, ctx.shared);
        }
        if (Array.isArray(node.children)) {
          node.children = await transformNodes(node.children, ctx);
        }
        out.push(node);
      }
    }
  }
  return out;
}

/** Parse a source file into {frontMatter, body} the way Docusaurus does. */
async function parseSource(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, content } = await DEFAULT_PARSE_FRONT_MATTER({
    filePath,
    fileContent,
  });
  return { frontMatter, body: content };
}

/** Parse and transform one file's body into mdast children. */
async function flattenBody(filePath, body, shared, stack) {
  if (stack.has(filePath)) {
    throw new Error(`Circular partial import involving ${filePath}`);
  }
  stack.add(filePath);
  const tree = await parseBody(filePath, body);
  const ctx = {
    filePath,
    dir: path.dirname(filePath),
    imports: new Map(),
    shared,
    stack,
  };
  const children = await transformNodes(tree.children, ctx);
  stack.delete(filePath);
  return { children, usedPartials: ctx.imports.size > 0 };
}

// Partials are cached by path + mtime and deep-cloned per use: the
// page-level link pass mutates nodes, and a shared subtree must not leak one
// host page's rewrites into another.
const partialCache = new Map();

async function flattenPartial(filePath, shared, stack) {
  const mtimeMs = fs.statSync(filePath).mtimeMs;
  const cached = partialCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return structuredClone(cached.children);
  }
  const { body } = await parseSource(filePath);
  const { children } = await flattenBody(filePath, body, shared, stack);
  partialCache.set(filePath, { mtimeMs, children });
  return structuredClone(children);
}

/**
 * Page-level link pass: make every remaining relative URL absolute. URL-style
 * relative links resolve against the page's permalink (matching how the
 * browser resolves them on the rendered page); links to doc pages point at
 * the page's .md version.
 */
function absolutizeLinks(nodes, permalink, shared) {
  const baseDir = path.posix.dirname(permalink === '/' ? '/index' : permalink);
  const rewrite = (url, isImage) => {
    if (isExternal(url) || url.startsWith('#')) {
      return url;
    }
    const { target, anchor } = splitAnchor(url);
    if (target === '') {
      return url;
    }
    let routePath = target.startsWith('/')
      ? path.posix.normalize(target)
      : path.posix.resolve(baseDir, target);
    routePath = urls.normalizePermalink(routePath);
    if (!isImage && shared.permalinks.has(routePath)) {
      return `${urls.mdUrl(routePath)}${anchor}`;
    }
    return `${urls.SITE_URL}${routePath}${anchor}`;
  };
  const walk = (list) => {
    for (const node of list || []) {
      if (node.type === 'link' || node.type === 'definition') {
        node.url = rewrite(node.url, false);
      } else if (node.type === 'image') {
        node.url = rewrite(node.url, true);
      } else if (node.type === 'paragraph') {
        // Unwrapped inline JSX can leave paragraph-edge whitespace, which
        // stringify would escape as `&#x20;`.
        trimTextEdges(node.children);
      }
      if (Array.isArray(node.children)) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
}

/**
 * Flatten a doc to its final markdown. Title chain: frontmatter title, else
 * the content H1 (promoted, not duplicated; a leading H1 that differs from
 * an explicit frontmatter title stays in the body), else the H1 a flattened
 * partial contributed, else the Docusaurus-computed title.
 */
async function flattenDoc(doc, sourcePath, shared) {
  const { stringifier } = await toolchain();
  const { frontMatter, body } = await parseSource(sourcePath);
  const fmTitle =
    typeof frontMatter.title === 'string' && frontMatter.title.trim()
      ? frontMatter.title.trim()
      : undefined;
  const { content: bodyContent, contentTitle } = parseMarkdownContentTitle(body, {
    removeContentTitle: true,
  });

  const { children, usedPartials } = await flattenBody(
    sourcePath,
    bodyContent,
    shared,
    new Set()
  );

  let partialTitle;
  if (children.length > 0 && children[0].type === 'heading' && children[0].depth === 1) {
    const text = textOf(children[0]).trim();
    if (!fmTitle || text === fmTitle) {
      partialTitle = text;
      children.shift();
    }
  }
  const title =
    fmTitle || contentTitle || partialTitle || (doc.title && doc.title.trim()) || doc.id;

  absolutizeLinks(children, doc.permalink, shared);

  const markdownBody = stringifier.stringify({ type: 'root', children }).trim();
  const markdown = `# ${title}\n\n${urls.pageUrl(doc.permalink)}\n\n${markdownBody}\n`;
  return { title, markdown, usedPartials };
}

module.exports = { flattenDoc };
