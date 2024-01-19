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
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'serverpod', // Usually your GitHub org/user name.
  projectName: 'serverpod.github.io', // Usually your repo name.
  deploymentBranch: 'test-deploy-branch',
  trailingSlash: false,

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
  scripts: [{
    src: "https://widget.kapa.ai/kapa-widget.bundle.js",
    "data-website-id": "9ae02024-c2cf-4f58-b2d9-7ca3961dc1ef",
    "data-project-name": "Serverpod",
    "data-project-color": "#020F24",
    "data-project-logo": "https://avatars.githubusercontent.com/u/48181558?s=200&v=4",
    async: true,
  }],
};

module.exports = config;