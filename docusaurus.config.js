// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { themes } from 'prism-react-renderer';
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Serverpod',
  tagline: 'The missing server for Flutter',
  url: 'https://serverpod.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'serverpod', // Usually your GitHub org/user name.
  projectName: 'serverpod.github.io', // Usually your repo name.
  trailingSlash: false,

  markdown: {
    mermaid: true,
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
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
        disableSwitch: false,
      },
      announcementBar: {
        id: 'serverpod_cloud',
        content:
          'Deployments with zero configuration coming soon. 🚀 Join the <strong>Serverpod Cloud</strong> <a href="https://forms.gle/JgFCqW3NY6WdDfct5" target="_blank">waiting list</a>.',
        backgroundColor: '#ffec9e',
        textColor: '#000000',
        isCloseable: false,
      },
      navbar: {
        // title: 'My Site',
        logo: {
          alt: 'Serverpod Logo',
          src: 'img/logo-horizontal.svg',
          srcDark: 'img/logo-horizontal-dark.svg',
          href: 'https://serverpod.dev',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'left',
          },
          {
            href: 'https://pub.dev/documentation/serverpod/latest/',
            label: 'API reference',
            position: 'right',
          },
          {
            href: 'https://careers.serverpod.dev/',
            label: 'Career',
            position: 'right',
          },
          {
            href: 'https://twitter.com/ServerpodDev',
            label: 'Twitter',
            position: 'right',
          },
          {
            href: 'https://github.com/serverpod/serverpod',
            label: 'GitHub',
            position: 'right',
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
  scripts: [
    {
      src: 'https://widget.kapa.ai/kapa-widget.bundle.js',
      'data-website-id': '9ae02024-c2cf-4f58-b2d9-7ca3961dc1ef',
      'data-project-name': 'Serverpod',
      'data-project-color': '#020F24',
      'data-project-logo':
        'https://avatars.githubusercontent.com/u/48181558?s=200&v=4',
      async: true,
    },
  ],
  plugins: [
    [
      'docusaurus-plugin-snipsync',
      {
        origins: [
          {
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
        redirects: [
          {
            // Moved in version 1.1.1
            from: ['/concepts/authentication'],
            to: '/concepts/authentication/setup',
          },
          {
            // Moved in version 1.1.1 and 2.1.0
            from: ['/tutorials', '/tutorials/videos'],
            to: '/tutorials/first-app',
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
        ],
      },
    ],
  ],
};

module.exports = config;
