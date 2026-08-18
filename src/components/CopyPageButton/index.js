/**
 * "Copy page as Markdown" button: fetches the page's generated .md endpoint
 * and writes it to the clipboard. The ClipboardItem is constructed
 * synchronously in the click handler with a promise for the text; Safari
 * invalidates the clipboard permission across an awaited fetch, so a
 * fetch-then-writeText order fails there. Fallbacks are capability-based.
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import {mdPath} from '@site/plugins/markdown-export/urls';
import styles from './styles.module.css';

// Lucide icons (https://lucide.dev), matching the navbar's icon set.
function IconCopy(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const RESET_DELAY_MS = 2500;

function label(state) {
  switch (state) {
    case 'loading':
      return translate({
        id: 'serverpod.copyPageButton.copying',
        message: 'Copying…',
        description: 'Copy page button label while the markdown is fetched',
      });
    case 'copied':
      return translate({
        id: 'serverpod.copyPageButton.copied',
        message: 'Copied',
        description: 'Copy page button label after a successful copy',
      });
    case 'error':
      return translate({
        id: 'serverpod.copyPageButton.failed',
        message: 'Copy failed',
        description: 'Copy page button label after a failed copy',
      });
    default:
      return translate({
        id: 'serverpod.copyPageButton.label',
        message: 'Copy as Markdown',
        description: 'Copy page button label',
      });
  }
}

function title() {
  return translate({
    id: 'serverpod.copyPageButton.title',
    message:
      'Copy the markdown version of this page, ready to paste into an AI assistant',
    description: 'Tooltip for the copy page button',
  });
}

async function fetchMarkdown(markdownPath) {
  const response = await fetch(markdownPath);
  const contentType = response.headers.get('content-type') || '';
  // The dev server's SPA fallback answers unknown paths with 200 + HTML.
  if (!response.ok || contentType.includes('text/html')) {
    throw new Error(`Markdown not available at ${markdownPath} (HTTP ${response.status})`);
  }
  return response.text();
}

function writeToClipboard(textPromise) {
  const writeText = () =>
    textPromise.then((text) => navigator.clipboard.writeText(text));
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      'text/plain': textPromise.then(
        (text) => new Blob([text], {type: 'text/plain'}),
      ),
    });
    // A clipboard-side rejection (permission, unsupported promise values)
    // retries the simpler API; a fetch failure re-rejects inside writeText.
    return navigator.clipboard.write([item]).catch(writeText);
  }
  if (navigator.clipboard?.writeText) {
    return writeText();
  }
  return Promise.reject(new Error('Clipboard API unavailable'));
}

function reportCopyEvent(params) {
  // gtag is absent on the dev server and behind ad blockers.
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  try {
    window.gtag('event', 'copy_page_markdown', params);
  } catch {}
}

export default function CopyPageButton({permalink, docsVersion}) {
  const [state, setState] = useState('idle');
  const resetTimer = useRef(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(resetTimer.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (state === 'loading') {
      return;
    }
    window.clearTimeout(resetTimer.current);
    setState('loading');
    const markdownPath = mdPath(permalink);
    const isCloud = permalink === '/cloud' || permalink.startsWith('/cloud/');
    const finish = (ok, error) => {
      if (error) {
        // Surface the cause (missing .md, clipboard denial) so a "Copy
        // failed" report is diagnosable from the console.
        console.error('[copy-page-markdown]', error);
      }
      reportCopyEvent({
        page_path: permalink,
        docs_instance: isCloud ? 'cloud' : 'framework',
        docs_version: docsVersion,
        status: ok ? 'success' : 'error',
      });
      if (!mounted.current) {
        return;
      }
      setState(ok ? 'copied' : 'error');
      resetTimer.current = window.setTimeout(() => setState('idle'), RESET_DELAY_MS);
    };
    writeToClipboard(fetchMarkdown(markdownPath)).then(
      () => finish(true),
      (error) => finish(false, error),
    );
  }, [state, permalink, docsVersion]);

  // aria-busy + click guard instead of `disabled`, which would drop keyboard
  // focus; the live region sits outside the button so screen readers still
  // announce it while the button's own subtree changes.
  return (
    <>
      <button
        type="button"
        className={clsx(styles.copyPageButton, {
          [styles.copyPageButtonError]: state === 'error',
        })}
        onClick={handleClick}
        aria-busy={state === 'loading'}
        title={title()}>
        <span className={styles.copyPageButtonIcon} aria-hidden="true">
          {state === 'copied' ? <IconCheck /> : <IconCopy />}
        </span>
        {label(state)}
      </button>
      <span role="status" aria-live="polite" className={styles.visuallyHidden}>
        {state === 'copied'
          ? translate({
              id: 'serverpod.copyPageButton.announceCopied',
              message: 'Page copied as Markdown',
              description: 'Screen reader announcement after a successful copy',
            })
          : ''}
        {state === 'error'
          ? translate({
              id: 'serverpod.copyPageButton.announceFailed',
              message: 'Copying the page failed',
              description: 'Screen reader announcement after a failed copy',
            })
          : ''}
      </span>
    </>
  );
}
