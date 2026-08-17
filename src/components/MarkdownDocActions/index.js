/**
 * Page-level markdown actions for a doc page: the row above the title
 * holding the version badge (when the page has one) and the "Copy as
 * Markdown" button, plus the page's text/markdown alternate link tag.
 */
import React from 'react';
import Head from '@docusaurus/Head';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import CopyPageButton from '@site/src/components/CopyPageButton';
import {normalizePermalink, mdUrl} from '@site/plugins/markdown-export/urls';
import styles from './styles.module.css';

export default function MarkdownDocActions({badge}) {
  // DocVersionBadge has a second theme render site (generated-index category
  // pages) that sits outside DocProvider, where useDoc throws. Those pages
  // have no markdown export, so render the badge slot unchanged there.
  let metadata;
  try {
    metadata = useDoc().metadata;
  } catch {
    return badge;
  }
  const permalink = normalizePermalink(metadata.permalink);
  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={mdUrl(permalink)} />
      </Head>
      <div className={styles.actionsRow}>
        {badge}
        <span className={styles.actionsEnd}>
          <CopyPageButton permalink={permalink} docsVersion={metadata.version} />
        </span>
      </div>
    </>
  );
}
