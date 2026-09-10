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
    from: ['/tutorials', '/tutorials/videos', '/tutorials/first-app', '/tutorials/tutorials/fundamentals'],
    to: '/tutorials/fundamentals',
  },
  {
    // Moved in version 1.2.0
    from: ['/concepts/database-communication', '/concepts/database/connection'],
    to: '/concepts/data-and-the-database/database/connection',
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
    from: ['/concepts/scheduling', '/concepts/scheduling/setup'],
    to: '/concepts/scheduling/overview',
  },
  {
    // Removed in version 4.0 together with the string-based future call API
    from: ['/concepts/scheduling/legacy'],
    to: '/concepts/scheduling/overview',
  },
  {
    from: ['/cloud/reference/cli/commands/secret'],
    to: '/cloud/reference/cli/commands/variable',
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
  {
    // Moved in version 4.0: the docs were regrouped into Concepts sections, the
    // deployment and tutorial pages were reorganized, and older upgrade guides
    // and the Serverpod Mini pages moved to the archive.
    from: ['/concepts/authentication/providers/anonymous/configuration', '/concepts/authentication/providers/anonymous/customizing-the-ui'],
    to: '/concepts/authentication/providers/anonymous/customizations',
  },
  {
    from: ['/concepts/authentication/providers/apple/configuration', '/concepts/authentication/providers/apple/customizing-the-ui'],
    to: '/concepts/authentication/providers/apple/customizations',
  },
  {
    from: ['/concepts/authentication/providers/facebook/configuration', '/concepts/authentication/providers/facebook/customizing-the-ui'],
    to: '/concepts/authentication/providers/facebook/customizations',
  },
  {
    from: ['/concepts/authentication/providers/github/configuration', '/concepts/authentication/providers/github/customizing-the-ui'],
    to: '/concepts/authentication/providers/github/customizations',
  },
  {
    from: ['/concepts/authentication/providers/google/configuration', '/concepts/authentication/providers/google/customizing-the-ui'],
    to: '/concepts/authentication/providers/google/customizations',
  },
  {
    from: ['/concepts/authentication/providers/microsoft/configuration', '/concepts/authentication/providers/microsoft/customizing-the-ui'],
    to: '/concepts/authentication/providers/microsoft/customizations',
  },
  {
    from: ['/concepts/authentication/providers/passkey/customizing-the-ui'],
    to: '/concepts/authentication/providers/passkey/setup',
  },
  {
    from: ['/concepts/database/crud'],
    to: '/concepts/data-and-the-database/database/crud',
  },
  {
    from: ['/concepts/database/indexing'],
    to: '/concepts/data-and-the-database/database/indexing',
  },
  {
    from: ['/concepts/database/migrations'],
    to: '/concepts/data-and-the-database/database/migrations',
  },
  {
    from: ['/concepts/database/pagination'],
    to: '/concepts/data-and-the-database/database/pagination',
  },
  {
    from: ['/concepts/database/raw-access'],
    to: '/concepts/data-and-the-database/database/raw-access',
  },
  {
    from: ['/concepts/database/relation-queries'],
    to: '/concepts/data-and-the-database/database/relation-queries',
  },
  {
    from: ['/concepts/database/row-locking'],
    to: '/concepts/data-and-the-database/database/row-locking',
  },
  {
    from: ['/concepts/database/runtime-parameters'],
    to: '/concepts/data-and-the-database/database/runtime-parameters',
  },
  {
    from: ['/concepts/database/transactions'],
    to: '/concepts/data-and-the-database/database/transactions',
  },
  {
    from: ['/concepts/database/filter'],
    to: '/concepts/data-and-the-database/database/filtering',
  },
  {
    from: ['/concepts/database/sort'],
    to: '/concepts/data-and-the-database/database/sorting',
  },
  {
    from: ['/concepts/database/models'],
    to: '/concepts/data-and-the-database/database/tables',
  },
  {
    from: ['/concepts/database/relations/many-to-many'],
    to: '/concepts/data-and-the-database/database/relations/many-to-many',
  },
  {
    from: ['/concepts/database/relations/modules'],
    to: '/concepts/data-and-the-database/database/relations/modules',
  },
  {
    from: ['/concepts/database/relations/one-to-many'],
    to: '/concepts/data-and-the-database/database/relations/one-to-many',
  },
  {
    from: ['/concepts/database/relations/one-to-one'],
    to: '/concepts/data-and-the-database/database/relations/one-to-one',
  },
  {
    from: ['/concepts/database/relations/referential-actions'],
    to: '/concepts/data-and-the-database/database/relations/referential-actions',
  },
  {
    from: ['/concepts/database/relations/self-relations'],
    to: '/concepts/data-and-the-database/database/relations/self-relations',
  },
  {
    from: ['/concepts/working-with-endpoints'],
    to: '/concepts/endpoints-and-apis',
  },
  {
    from: ['/concepts/backward-compatibility'],
    to: '/concepts/endpoints-and-apis/backward-compatibility',
  },
  {
    from: ['/concepts/caching'],
    to: '/concepts/endpoints-and-apis/caching',
  },
  {
    from: ['/concepts/file-uploads'],
    to: '/concepts/endpoints-and-apis/file-uploads',
  },
  {
    from: ['/concepts/server-events'],
    to: '/concepts/endpoints-and-apis/server-events',
  },
  {
    from: ['/concepts/sessions'],
    to: '/concepts/endpoints-and-apis/sessions',
  },
  {
    from: ['/concepts/streams'],
    to: '/concepts/endpoints-and-apis/streaming',
  },
  {
    from: ['/concepts/exceptions'],
    to: '/concepts/endpoints-and-apis/error-handling-and-exceptions',
  },
  {
    from: ['/concepts/models'],
    to: '/concepts/data-and-the-database/models',
  },
  {
    from: ['/concepts/serialization'],
    to: '/concepts/data-and-the-database/models/custom-serialization',
  },
  {
    from: ['/concepts/shared-packages'],
    to: '/concepts/data-and-the-database/models/shared-packages',
  },
  {
    from: ['/concepts/configuration', '/concepts/experimental'],
    to: '/concepts/server-fundamentals/configuration',
  },
  {
    from: ['/concepts/modules'],
    to: '/concepts/server-fundamentals/modules',
  },
  {
    from: ['/concepts/health-checks'],
    to: '/concepts/operations/health-checks',
  },
  {
    from: ['/concepts/logging'],
    to: '/concepts/operations/logging',
  },
  {
    from: ['/concepts/security-configuration'],
    to: '/concepts/operations/security-and-tls',
  },
  {
    from: ['/concepts/scheduling/recurring-task'],
    to: '/concepts/scheduling/recurring-tasks',
  },
  {
    from: ['/concepts/testing/the-basics'],
    to: '/concepts/testing/get-started',
  },
  {
    from: ['/concepts/testing/best-practises'],
    to: '/concepts/testing/best-practices',
  },
  {
    from: ['/concepts/webserver/flutter-web'],
    to: '/concepts/web-server/flutter-web',
  },
  {
    from: ['/concepts/webserver/overview'],
    to: '/concepts/web-server/overview',
  },
  {
    from: ['/concepts/webserver/request-data'],
    to: '/concepts/web-server/request-data',
  },
  {
    from: ['/concepts/webserver/routing'],
    to: '/concepts/web-server/routing',
  },
  {
    from: ['/concepts/webserver/server-side-html'],
    to: '/concepts/web-server/server-side-html',
  },
  {
    from: ['/concepts/webserver/single-page-apps'],
    to: '/concepts/web-server/single-page-apps',
  },
  {
    from: ['/concepts/webserver/static-files'],
    to: '/concepts/web-server/static-files',
  },
  {
    from: ['/concepts/webserver/middleware'],
    to: '/concepts/web-server/web-server-middleware',
  },
  {
    from: ['/deployments/deployment-strategy'],
    to: '/deployments/custom-hosting/choosing-a-strategy',
  },
  {
    from: ['/deployments/general', '/deployments/deploying-to-aws', '/deployments/deploying-to-gce-terraform', '/deployments/deploying-to-gcr-console'],
    to: '/deployments/custom-hosting/hosting-elsewhere',
  },
  {
    from: ['/deployments/community-supported-deployments'],
    to: '/deployments/custom-hosting/community-supported',
  },
  {
    from: ['/overview'],
    to: '/how-it-works',
  },
  {
    from: ['/serverpod-mini'],
    to: '/upgrading/archive/upgrade-from-mini',
  },
  {
    from: ['/tutorials/academy'],
    to: '/serverpod-academy',
  },
  {
    from: ['/tutorials/tutorials/ai-and-rag'],
    to: '/tutorials/ai-and-rag',
  },
  {
    from: ['/tutorials/tutorials/real-time-communication'],
    to: '/tutorials/real-time-communication',
  },
  {
    from: ['/upgrading/upgrade-from-mini'],
    to: '/upgrading/archive/upgrade-from-mini',
  },
  {
    from: ['/upgrading/upgrade-to-pgvector'],
    to: '/upgrading/archive/upgrade-to-pgvector',
  },
  {
    from: ['/upgrading/upgrade-to-three'],
    to: '/upgrading/archive/upgrade-to-three',
  },
];
