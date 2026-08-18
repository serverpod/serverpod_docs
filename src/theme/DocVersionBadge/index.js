/**
 * Docusaurus wrappers must live at the wrapped component's theme path, and
 * DocVersionBadge is the slot every doc page renders above its title. The
 * feature itself lives in MarkdownDocActions.
 */
import React from 'react';
import DocVersionBadge from '@theme-original/DocVersionBadge';
import MarkdownDocActions from '@site/src/components/MarkdownDocActions';

export default function DocVersionBadgeWrapper(props) {
  return <MarkdownDocActions badge={<DocVersionBadge {...props} />} />;
}
