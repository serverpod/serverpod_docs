// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import {
  themes
} from 'prism-react-renderer';
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Serverpod',
  tagline: 'The missing server for Flutter',
  url: 'https://docs.serverpod.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  favicon: 'img/favicon.png',
  organizationName: 'serverpod', // Usually your GitHub org/user name.
  projectName: 'serverpod.github.io', // Usually your repo name.
  trailingSlash: false,

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    }
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/serverpod/serverpod_docs/tree/main/',
          breadcrumbs: false,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: 'G-0EYLJMP04H',
          anonymizeIP: true,
        },
        googleTagManager: {
          containerId: 'GTM-WG5VRRKX',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
        disableSwitch: true,
      },
      navbar: {
        // title: 'My Site',
        logo: {
          alt: 'Serverpod Logo',
          src: 'img/logo-horizontal.svg',
          srcDark: 'img/logo-horizontal-dark.svg',
          href: 'https://serverpod.dev',
        },
        items: [{
            type: 'docsVersionDropdown',
            position: 'left',
          },
          {
            href: 'https://pub.dev/documentation/serverpod/latest/',
            position: 'right',
            html: `<span class="serverpod-nav-icon-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="serverpod-nav-icon lucide lucide-book-marked-icon lucide-book-marked"><path d="M10 2v8l3-3 3 3V2"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg><span class="serverpod-nav-text">API reference</span></span>`,
          },
          {
            href: 'https://careers.serverpod.dev/',
            position: 'right',
            html: `<span class="serverpod-nav-icon-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="serverpod-nav-icon lucide lucide-briefcase-business-icon lucide-briefcase-business"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg><span class="serverpod-nav-text">Open jobs</span></span>`,
          },
          {
            href: 'https://github.com/serverpod/serverpod',
            position: 'right',
            html: `<span class="serverpod-nav-icon-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="serverpod-nav-icon lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg><span class="serverpod-nav-text">GitHub</span></span>`,
          },
          {
            type: 'search',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Serverpod authors.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['dart', 'bash'],
      },
    }),
  scripts: [{
    src: 'https://widget.kapa.ai/kapa-widget.bundle.js',
    'data-website-id': '9ae02024-c2cf-4f58-b2d9-7ca3961dc1ef',
    'data-project-name': 'Serverpod',
    'data-project-color': '#020F24',
    'data-project-logo': 'https://avatars.githubusercontent.com/u/48181558?s=200&v=4',
    async: true,
  }, ],
  plugins: [
    [
      'docusaurus-plugin-snipsync',
      {
        origins: [{
            files: {
              pattern: '../serverpod/examples/**/*.{dart,yaml}',
            },
          },
          {
            owner: 'serverpod',
            repo: 'serverpod',
            files: {
              pattern: 'examples/**/*.{dart,yaml}',
            },
          },
          {
            owner: 'serverpod',
            repo: 'serverpod',
            ref: 'feat/add-getting-started-examples',
            files: {
              pattern: 'examples/**/*.{dart,yaml}',
            },
          },
        ],
        targets: ['docs'],
        features: {
          enable_source_link: false,
          allowed_target_extensions: ['.md', '.mdx'],
          enable_code_block: true,
        },
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [{
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
        ],
      },
    ],
  ],
};

module.exports = config;