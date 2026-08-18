// Single source of truth for the site's public URL and the permalink-to-
// markdown mapping, shared by the generator plugin, the theme components,
// the site config, and the CI verifier. Environment-neutral on purpose: it
// must load in Node scripts and in the browser bundle alike.

const SITE_URL = 'https://docs.serverpod.dev';
const BASE_URL = '/';

// Docusaurus keeps a trailing slash on some doc permalinks (version roots,
// directory-index pages) even with `trailingSlash: false`, while routes and
// the sitemap serve them without it.
function normalizePermalink(permalink) {
  if (permalink !== '/' && permalink.endsWith('/')) {
    return permalink.slice(0, -1);
  }
  return permalink;
}

// Site-relative path of a page's markdown endpoint. Permalinks already
// include the base URL; the root doc maps to index.md.
function mdPath(permalink) {
  if (permalink === '/' || permalink === BASE_URL) {
    return `${BASE_URL}index.md`;
  }
  return `${permalink}.md`;
}

// Absolute URL of a page's markdown endpoint.
function mdUrl(permalink) {
  return `${SITE_URL}${mdPath(permalink)}`;
}

// A page's canonical absolute URL.
function pageUrl(permalink) {
  return permalink === '/' ? SITE_URL : `${SITE_URL}${permalink}`;
}

// Output file path relative to the build root for a permalink.
function mdFilePath(permalink) {
  return mdPath(permalink).slice(BASE_URL.length);
}

module.exports = {
  SITE_URL,
  BASE_URL,
  normalizePermalink,
  mdPath,
  mdUrl,
  pageUrl,
  mdFilePath,
};
