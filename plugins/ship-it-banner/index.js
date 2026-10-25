// Site-wide announcement banner for the Ship it with Serverpod campaign.
//
// Everything about the campaign lives in this file: the on/off switch, the
// copy, the A/B test, the links, and the dates. The banner uses Docusaurus's
// built-in `announcementBar` (dismissible, remembered per browser), and this
// plugin adds the date logic and the A/B test on top of it:
//
// - An inline script in <head> sets `data-ship-it-banner` on <html> to
//   `pending`, `main`, `last-days`, or `ended` from the visitor's clock, before
//   the page paints. CSS in `styles.css` shows the matching copy, or hides the
//   bar before the start and once the campaign has ended. The check runs in the
//   browser, so the banner switches copy and disappears on time without a
//   rebuild.
// - The same script picks the copy variant from the PostHog feature flag
//   COPY_FLAG_KEY and sets `data-ship-it-copy` on <html>. Every variant is
//   rendered on the server, and CSS from `copyCss()` shows the selected one.
// - A click on the banner button is captured in PostHog as CLICK_EVENT, the
//   conversion for the experiment.
// - A build made after the campaign ends leaves the banner out entirely.
//
// SHIP_IT_BANNER_ENABLED is the master switch. While it is true, the banner
// shows from STARTS_AT until ENDS_AT.

const SHIP_IT_BANNER_ENABLED = true;

// 2026-10-26 00:00 CET. From this moment the main copy is shown.
const STARTS_AT = '2026-10-25T23:00:00Z';
// 2026-11-07 23:59 CET. From this moment the last-days copy is shown.
const LAST_DAYS_FROM = '2026-11-07T22:59:00Z';
// 2026-11-09 23:59 CET. From this moment the banner is hidden.
const ENDS_AT = '2026-11-09T22:59:00Z';

const BANNER_ID = 'ship-it-with-serverpod-2026';
const CTA_LABEL = 'Enter now';
const CAMPAIGN_URL =
  'https://serverpod.dev/blog/ship-it-with-serverpod?utm_source=docs&utm_medium=banner&utm_campaign=ship-it-with-serverpod';

// A/B test. The keys of COPY_VARIANTS must match the variant keys of the
// multivariate PostHog feature flag COPY_FLAG_KEY. Visitors without a usable
// flag value see CONTROL_VARIANT.
const COPY_FLAG_KEY = 'ship-it-banner-copy';
const CONTROL_VARIANT = 'control';
const COPY_VARIANTS = {
  control:
    'Built something real? Win three sessions with our engineers to help it grow',
  help: 'Built something real? Let us help it grow, with three sessions with our engineers',
  celebrate: 'Built something real? We want to celebrate it and help it grow',
  prize:
    'Built something real? Win 12 months on Serverpod Cloud, up to $2,000, plus three sessions with our engineers',
  short: 'Built something real? Win three sessions with our engineers',
};
// How long the banner content may stay hidden while the flag loads. After
// this the visitor sees CONTROL_VARIANT and is left out of the experiment.
const COPY_FLAG_TIMEOUT_MS = 1500;
// Conversion event for the experiment.
const CLICK_EVENT = 'ship_it_banner_clicked';

const PHASES = {
  main: {
    text: (copy) => copy,
    href: `${CAMPAIGN_URL}&utm_content=banner`,
  },
  'last-days': {
    text: (copy) => `${copy}. Less than 48 hours left.`,
    href: `${CAMPAIGN_URL}&utm_content=banner-last-days`,
  },
};

const PLUGIN_NAME = 'serverpod-ship-it-banner';

// Variant keys end up in CSS selectors and in the inline script.
for (const variant of Object.keys(COPY_VARIANTS)) {
  if (!/^[a-z0-9-]+$/.test(variant) || variant === 'loading') {
    throw new Error(`${PLUGIN_NAME}: invalid copy variant key "${variant}"`);
  }
}
if (!(CONTROL_VARIANT in COPY_VARIANTS)) {
  throw new Error(`${PLUGIN_NAME}: COPY_VARIANTS has no "${CONTROL_VARIANT}"`);
}

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

// Every phase and copy variant is rendered on the server. The
// `data-ship-it-banner` and `data-ship-it-copy` attributes on <html> decide
// which one is visible, so React hydration never changes the banner.
function bannerContent() {
  return Object.entries(PHASES)
    .map(([phase, {text, href}]) => {
      const texts = Object.entries(COPY_VARIANTS)
        .map(
          ([variant, copy]) =>
            `<span class="ship-it-banner__text ship-it-banner__text--${variant}">${escapeHtml(text(copy))}</span>`
        )
        .join('');
      return (
        `<span class="ship-it-banner ship-it-banner--${phase}">` +
        `<img class="ship-it-banner__icon" src="/img/megaphone.webp" alt="" width="40" height="40">` +
        texts +
        `<a class="ship-it-banner__cta" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(CTA_LABEL)}</a>` +
        `</span>`
      );
    })
    .join('');
}

// Shows exactly one copy variant. The control copy shows unless
// `data-ship-it-copy` names another variant, so it is also what visitors
// without JavaScript see.
function copyCss() {
  const others = Object.keys(COPY_VARIANTS).filter(
    (variant) => variant !== CONTROL_VARIANT
  );
  const hideControl = others.map(
    (variant) =>
      `html[data-ship-it-copy='${variant}'] .ship-it-banner__text--${CONTROL_VARIANT}`
  );
  const hideOthers = others.map(
    (variant) =>
      `html:not([data-ship-it-copy='${variant}']) .ship-it-banner__text--${variant}`
  );
  return `${[...hideControl, ...hideOthers].join(',\n')} {\n  display: none;\n}`;
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

// Runs in the browser before first paint.
//
// Phase: set from the visitor's clock, and re-checked at the next boundary for
// tabs that stay open.
//
// Copy: once the phase is `main` or `last-days`, `data-ship-it-copy` is set to
// `loading`, which hides the banner content but keeps the bar's height. The
// script then waits for PostHog, which Google Tag Manager loads late or not at
// all. When the flags arrive and the bar is visible (not dismissed), it reads
// the flag, which records the exposure, and shows that variant. A missing,
// false, or unknown flag value shows the control copy. If the flags have not
// arrived after COPY_FLAG_TIMEOUT_MS, or the bar is not visible, the control
// copy shows and the flag is never read, so that visitor is not counted in
// the experiment.
//
// Clicks: a listener on `document` captures CLICK_EVENT when the banner button
// is clicked. It is delegated, so it survives React hydration and page
// navigation, and it never blocks the link.
function bannerScript() {
  return `(function () {
  var startsAt = ${Date.parse(STARTS_AT)};
  var lastDaysFrom = ${Date.parse(LAST_DAYS_FROM)};
  var endsAt = ${Date.parse(ENDS_AT)};
  var flagKey = ${JSON.stringify(COPY_FLAG_KEY)};
  var variants = ${JSON.stringify(Object.keys(COPY_VARIANTS))};
  var control = ${JSON.stringify(CONTROL_VARIANT)};
  var timeoutMs = ${COPY_FLAG_TIMEOUT_MS};
  var clickEvent = ${JSON.stringify(CLICK_EVENT)};
  var root = document.documentElement;
  var copyState = 'idle';

  function isVariant(value) {
    return typeof value === 'string' && variants.indexOf(value) !== -1;
  }
  function settle(value) {
    if (copyState === 'settled') return;
    copyState = 'settled';
    root.setAttribute('data-ship-it-copy', isVariant(value) ? value : control);
  }
  function whenDomReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
  function isBarVisible() {
    var bar = document.querySelector('.theme-announcement-bar');
    return !!bar && bar.getClientRects().length > 0;
  }
  function onFlags() {
    whenDomReady(function () {
      if (copyState !== 'loading') return;
      if (!isBarVisible()) return settle(control);
      var value;
      try {
        value = window.posthog.getFeatureFlag(flagKey);
      } catch (e) {}
      settle(value);
    });
  }
  function waitForPosthog() {
    if (copyState !== 'loading') return;
    var posthog = window.posthog;
    if (posthog && typeof posthog.onFeatureFlags === 'function') {
      try {
        posthog.onFeatureFlags(onFlags);
      } catch (e) {}
      return;
    }
    setTimeout(waitForPosthog, 100);
  }
  function startCopy() {
    if (copyState !== 'idle') return;
    copyState = 'loading';
    root.setAttribute('data-ship-it-copy', 'loading');
    setTimeout(function () {
      settle(control);
    }, timeoutMs);
    whenDomReady(function () {
      if (copyState === 'loading' && !isBarVisible()) settle(control);
    });
    waitForPosthog();
  }

  function updatePhase() {
    var now = Date.now();
    var phase = now >= endsAt ? 'ended' : now >= lastDaysFrom ? 'last-days' : now >= startsAt ? 'main' : 'pending';
    root.setAttribute('data-ship-it-banner', phase);
    if (phase === 'main' || phase === 'last-days') startCopy();
    if (phase === 'ended') return;
    var next = phase === 'pending' ? startsAt : phase === 'main' ? lastDaysFrom : endsAt;
    var wait = next - now;
    if (wait < 2147483647) setTimeout(updatePhase, wait + 1000);
  }

  function trackClick(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (!target.closest('.ship-it-banner__cta')) return;
    var posthog = window.posthog;
    if (!posthog || typeof posthog.capture !== 'function') return;
    var shown = root.getAttribute('data-ship-it-copy');
    try {
      posthog.capture(clickEvent, {
        variant: isVariant(shown) ? shown : control,
        phase: root.getAttribute('data-ship-it-banner'),
        site: 'docs'
      });
    } catch (e) {}
  }

  document.addEventListener('click', trackClick, true);
  document.addEventListener('auxclick', trackClick, true);
  updatePhase();
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
        headTags: [
          {tagName: 'style', innerHTML: copyCss()},
          {tagName: 'script', innerHTML: bannerScript()},
        ],
      };
    },
  };
}

module.exports = shipItBannerPlugin;
module.exports.shipItAnnouncementBar = shipItAnnouncementBar;
