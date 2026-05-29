# Reference page template

A reference page is a lookup. The reader knows what they're looking for: a schema, a rule, a list of valid values, a parameter set. They open the page, find the answer, and close it. They're not reading top to bottom; they're scanning.

**Use for:** pages in the Reference section — schemas, rules, exhaustive enumerations.  
**Don't use for:** narrative capability explanations (concept), procedural how-tos (guide), or new-user walkthroughs (tutorial). The CLI reference is auto-generated and follows its own pattern.

---

## Skeleton

```markdown
---
description: <One sentence summary, 120–160 chars. Used for SEO and AI retrieval. Required.>
---

# <Reference subject>

One to three sentences. What this reference covers and when the reader needs it.
Don't open with "This page documents..." Open with the substance.

## <Lookup body>

Format depends on the subject. Pick what makes the reader's lookup fastest:

For a schema:
  - Structured table or hierarchical list.
  - Each entry: key name, type, required/optional, default, description.
  - Group related keys under sub-headings.
  - Show a complete example at the top or bottom.

For rules:
  - Lead with the rules as a bulleted list.
  - Follow with valid and invalid examples.
  - Document version selection logic or precedence explicitly.

For enumerations:
  - Table with one row per item.
  - Columns are the attributes the reader will compare.
  - Sort by what the reader is most likely to pick first.

Avoid narrative paragraphs. Reference pages reward scanning; prose hides the answer.

## Error messages

OPTIONAL. Use when the subject produces specific error messages the reader will encounter.
Format: each error gets a sub-heading with the verbatim message, followed by cause and fix.

## Examples

OPTIONAL. Use when the reader benefits from seeing the subject applied to several common cases.
Omit if the lookup body already has sufficient examples inline.

## Related

OPTIONAL but recommended.

- [<Linked page>](path) — <one-line description>
```

---

## Voice

- **Terse.** "Defaults to false" beats "This value defaults to false if you don't specify it."
- **No hedging.** "Returns the deployment ID" not "Should return the deployment ID."
- **No second person except in examples.** The body describes the subject; it doesn't address the reader.
- **Verbatim accuracy.** Error messages, key names, and command syntax must match exactly what the system produces or accepts.

## Length

No fixed target — complete and no longer. A schema page might run 1,000–2,500 words; a rules page 200–400 words; an enumeration 300–800 words. Over 3,000 words: consider splitting by sub-topic.

## Anchors

Reference pages are linked to with anchor fragments more than any other page type. Keep H2 and H3 headings stable across rewrites; renaming them breaks inbound anchors silently.

## Checklist before publishing

- [ ] `description` frontmatter is present and reads well in isolation (120–160 chars).
- [ ] Overview is brief (one to three sentences) and substantive (no marketing).
- [ ] The lookup body uses the right format for the subject.
- [ ] Every key, value, rule, or item is documented; nothing silently omitted.
- [ ] Code blocks are language-tagged; `title` attributes used for complete file examples.
- [ ] Error messages quote the exact text the system produces.
- [ ] H2 and H3 headings are stable; no rewording of headings that have inbound anchors.
- [ ] No narrative explanation, no best-practice commentary, no hedging.
- [ ] Related section links to the paired concept page and any guides that use this subject.
