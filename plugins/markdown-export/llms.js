// Builders for the llms.txt index and the per-instance llms-full.txt files,
// following the llmstxt.org shape: H1 title, blockquote summary, then
// H2-delimited link-list sections, with an Optional section for the
// full-content files.

const { SITE_URL, mdUrl } = require('./urls');

const SITE_SUMMARY =
  'Serverpod is an open-source app server for the Flutter community, written in Dart. ' +
  'Every documentation page is also available as markdown at its page URL with `.md` appended. ' +
  'This index covers the current stable framework docs and the Serverpod Cloud docs.';

function escapeTitle(title) {
  return title.replace(/[\[\]]/g, '');
}

function linkLine(doc) {
  const title = escapeTitle(doc.title || doc.id);
  const description =
    typeof doc.description === 'string' && doc.description.trim()
      ? `: ${doc.description.trim().replace(/\s+/g, ' ')}`
      : '';
  return `- [${title}](${mdUrl(doc.permalink)})${description}`;
}

function buildLlmsTxt({ frameworkDocs, cloudDocs }) {
  const lines = [
    '# Serverpod documentation',
    '',
    `> ${SITE_SUMMARY}`,
    '',
    '## Framework documentation',
    '',
    ...frameworkDocs.map(linkLine),
    '',
    '## Serverpod Cloud documentation',
    '',
    ...cloudDocs.map(linkLine),
    '',
    '## Optional',
    '',
    `- [Framework documentation as a single file](${SITE_URL}/llms-full.txt)`,
    `- [Serverpod Cloud documentation as a single file](${SITE_URL}/cloud/llms-full.txt)`,
    '',
  ];
  return lines.join('\n');
}

function buildLlmsFullTxt({ title, summary, docs, rendered }) {
  const parts = [`# ${title}\n\n> ${summary}`];
  for (const doc of docs) {
    const markdown = rendered.get(doc.permalink);
    if (!markdown) {
      // A silent skip would ship a partial single-file export that still
      // passes every link check.
      throw new Error(`llms-full: no rendered markdown for ${doc.permalink}`);
    }
    parts.push(markdown.trim());
  }
  return `${parts.join('\n\n---\n\n')}\n`;
}

module.exports = { buildLlmsTxt, buildLlmsFullTxt };
