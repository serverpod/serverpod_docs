// Site-wide announcement banner for the Ship it with Serverpod campaign.
//
// Everything about the campaign lives in this file: the on/off switch, the
// copy, the links, and the dates. The banner uses Docusaurus's built-in
// `announcementBar` (dismissible, remembered per browser), and this plugin
// adds the date logic on top of it:
//
// - An inline script in <head> sets `data-ship-it-banner` on <html> to `main`,
//   `last-days`, or `ended` from the visitor's clock, before the page paints.
//   CSS in `styles.css` shows the matching copy, or hides the bar once the
//   campaign has ended. The check runs in the browser, so the banner switches
//   copy and disappears on time without a rebuild.
// - A build made after the campaign ends leaves the banner out entirely.
//
// To launch the banner, set SHIP_IT_BANNER_ENABLED to true.

const SHIP_IT_BANNER_ENABLED = false;

// 2026-11-07 23:59 CET. From this moment the last-days copy is shown.
const LAST_DAYS_FROM = '2026-11-07T22:59:00Z';
// 2026-11-09 23:59 CET. From this moment the banner is hidden.
const ENDS_AT = '2026-11-09T22:59:00Z';

const BANNER_ID = 'ship-it-with-serverpod-2026';
const CTA_LABEL = 'See how to enter';
const CAMPAIGN_URL =
  'https://serverpod.dev/blog/ship-it-with-serverpod?utm_source=docs&utm_medium=banner&utm_campaign=ship-it-with-serverpod';

const VARIANTS = {
  main: {
    text: 'Built something real on Serverpod? Win three sessions with a Serverpod engineer',
    href: `${CAMPAIGN_URL}&utm_content=banner`,
  },
  'last-days': {
    text: 'Built something real on Serverpod? Win three sessions with a Serverpod engineer. Less than 48 hours left.',
    href: `${CAMPAIGN_URL}&utm_content=banner-last-days`,
  },
};

const PLUGIN_NAME = 'serverpod-ship-it-banner';

function isLiveAtBuild() {
  return SHIP_IT_BANNER_ENABLED && Date.now() < Date.parse(ENDS_AT);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Both variants are rendered on the server. The `data-ship-it-banner` attribute
// on <html> decides which one is visible, so the right copy shows on first
// paint and there is no flash after hydration.
function bannerContent() {
  return Object.entries(VARIANTS)
    .map(
      ([phase, {text, href}]) =>
        `<span class="ship-it-banner ship-it-banner--${phase}">` +
        `<span class="ship-it-banner__text">${escapeHtml(text)}</span> ` +
        `<a class="ship-it-banner__cta" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(CTA_LABEL)}</a>` +
        `</span>`,
    )
    .join('');
}

// Value for `themeConfig.announcementBar` in docusaurus.config.js.
function shipItAnnouncementBar() {
  if (!isLiveAtBuild()) {
    return undefined;
  }
  return {
    id: BANNER_ID,
    content: bannerContent(),
    isCloseable: true,
  };
}

// Runs in the browser before first paint. Sets the phase from the visitor's
// clock and re-checks at the next boundary for tabs that stay open.
function phaseScript() {
  return `(function () {
  var lastDaysFrom = ${Date.parse(LAST_DAYS_FROM)};
  var endsAt = ${Date.parse(ENDS_AT)};
  function update() {
    var now = Date.now();
    var phase = now >= endsAt ? 'ended' : now >= lastDaysFrom ? 'last-days' : 'main';
    document.documentElement.setAttribute('data-ship-it-banner', phase);
    if (phase === 'ended') return;
    var wait = (phase === 'main' ? lastDaysFrom : endsAt) - now;
    if (wait < 2147483647) setTimeout(update, wait + 1000);
  }
  update();
})();`;
}

function shipItBannerPlugin() {
  return {
    name: PLUGIN_NAME,
    getClientModules() {
      return isLiveAtBuild() ? [require.resolve('./styles.css')] : [];
    },
    injectHtmlTags() {
      if (!isLiveAtBuild()) {
        return {};
      }
      return {
        headTags: [{tagName: 'script', innerHTML: phaseScript()}],
      };
    },
  };
}

module.exports = shipItBannerPlugin;
module.exports.shipItAnnouncementBar = shipItAnnouncementBar;
