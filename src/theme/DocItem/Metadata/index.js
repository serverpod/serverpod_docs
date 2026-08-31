import React from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import { useDoc, useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  openGraphImageForDoc,
} from '@site/plugins/open-graph-images/shared';

/* global __SERVERPOD_OG_RENDER_FINGERPRINTS_BY_ICON__ */

export default function DocItemMetadata() {
  const { metadata, frontMatter, assets } = useDoc();
  const sidebar = useDocsSidebar();
  const { generatedImage, image } = openGraphImageForDoc({
    assetImage: assets.image,
    frontMatterImage: frontMatter.image,
    title: metadata.title,
    description: metadata.description,
    docId: metadata.id,
    permalink: metadata.permalink,
    directClassName: frontMatter.sidebar_class_name,
    sidebarItems: sidebar?.items,
    renderFingerprintByIconFileName:
      __SERVERPOD_OG_RENDER_FINGERPRINTS_BY_ICON__,
  });

  return (
    <PageMetadata
      title={metadata.title}
      description={metadata.description}
      keywords={frontMatter.keywords}
      image={image}
    >
      {generatedImage && (
        <>
          <meta property="og:image:width" content={String(CARD_WIDTH)} />
          <meta property="og:image:height" content={String(CARD_HEIGHT)} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta
            property="og:image:alt"
            content={`${metadata.title}, Serverpod documentation`}
          />
          <meta
            name="twitter:image:alt"
            content={`${metadata.title}, Serverpod documentation`}
          />
        </>
      )}
    </PageMetadata>
  );
}
