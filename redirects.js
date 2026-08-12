// Client-side redirects for pages that moved. Consumed by the
// client-redirects plugin in docusaurus.config.js, by the markdown-export
// plugin (which turns each source into a "moved to" .md stub), and by
// util/verify_markdown_export.js.

module.exports = [{
    // Moved in version 1.1.1
    from: ['/concepts/authentication'],
    to: '/concepts/authentication/setup',
  },
  {
    // Moved in version 1.1.1, 2.1.0 and 2.9.0
    from: ['/tutorials', '/tutorials/videos', '/tutorials/first-app'],
    to: '/tutorials/tutorials/fundamentals',
  },
  {
    // Moved in version 1.2.0
    from: ['/concepts/database-communication'],
    to: '/concepts/database/connection',
  },
  {
    // Moved in version 2.1.0
    from: ['/insights'],
    to: '/tools/insights',
  },
  {
    // Moved in version 2.1.0
    from: ['/roadmap'],
    to: '/contribute',
  },
  {
    // Moved in version 2.7.0
    from: ['/get-started'],
    to: '/get-started/creating-endpoints',
  },
  {
    // Moved when scheduling was reorganized from a single page to a directory
    from: ['/concepts/scheduling'],
    to: '/concepts/scheduling/setup',
  },
  {
    from: ['/cloud/reference/deployment/deploying-your-application'],
    to: '/cloud/concepts/deployments',
  },
  {
    from: ['/cloud/guides/logs', '/cloud/reference/logging'],
    to: '/cloud/concepts/logs',
  },
  {
    from: ['/cloud/guides/passwords'],
    to: '/cloud/concepts/passwords-secrets-env-vars',
  },
  {
    from: ['/cloud/guides/custom-domains'],
    to: '/cloud/concepts/custom-domains',
  },
  {
    from: ['/cloud/guides/database'],
    to: '/cloud/concepts/database',
  },
  {
    from: ['/cloud/reference/personal-access-tokens'],
    to: '/cloud/concepts/personal-access-tokens',
  },
  {
    from: ['/cloud/reference/deployment/assets'],
    to: '/cloud/guides/ship-non-dart-files',
  },
  {
    from: ['/cloud/reference/deployment/deployment-hooks'],
    to: '/cloud/concepts/deployment-hooks',
  },
  {
    from: ['/cloud/reference/deployment/github-automation'],
    to: '/cloud/guides/deploy-from-ci-with-github-actions',
  },
  {
    from: ['/cloud/reference/deployment/handling-private-dependencies'],
    to: '/cloud/reference/private-dependencies',
  },
  {
    from: ['/cloud/reference/deployment/dart-sdk-versions'],
    to: '/cloud/reference/dart-sdk-versions',
  },
  {
    from: ['/cloud/reference/project-id'],
    to: '/cloud/reference/project-id-rules',
  },
];
