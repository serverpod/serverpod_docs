// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Serverpod',
  tagline: 'The missing server for Flutter',
  url: 'https://docs.serverpod.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'serverpod', // Usually your GitHub org/user name.
  projectName: 'serverpod', // Usually your repo name.

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
        items: [
          {
            href: 'https://thehub.io/startups/serverpod',
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
        additionalLanguages: ['dart'],
      },
    }),
};

module.exports = config;
