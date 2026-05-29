# Guide page template

A guide is a procedural how-to. The reader has a specific task to accomplish, often spanning multiple capabilities or involving an external system. They open the page mid-task, follow the steps, and close it with the task done.

If a procedure fits inside a single capability, it belongs as an operation on that capability's concept page, not as a guide.

**Use for:** pages in the Guides section.  
**Don't use for:** new-user walkthroughs (tutorial), single-capability operations (concept page), or schema and rule lookups (reference).

---

## Skeleton

```markdown
---
description: <One sentence summary, 120–160 chars. Used for SEO and AI retrieval. Required.>
---

# <Action-shaped page title>

What this guide helps the reader accomplish, in plain language. One short paragraph. Tell them
what they'll have at the end and roughly how long it will take.

Don't open with "In this guide, you will learn..." Open with the task:
"Deploy your Serverpod app from a GitHub Actions workflow."

If the guide is about a workaround, say so up front and link to the roadmap status.

## Before you start

- <Prerequisite 1>
- <Prerequisite 2>
- <Prerequisite 3>

## <Step 1: action-shaped heading>

One or two sentences explaining what this step does and why.

<command, configuration, or action>

<expected output or result>

## <Step 2: action-shaped heading>

<as above>

## Verify

OPTIONAL but recommended where the result isn't obvious. Tell the reader how to confirm the
procedure worked.

## Troubleshooting

OPTIONAL. Use only for 2–4 well-defined failure modes the reader will plausibly hit.
Don't reproduce content covered by a dedicated failure-mode guide — link there instead.
Format: question-shaped headings. Each entry: cause, fix.

## Related

OPTIONAL but recommended.

- [<Linked page>](path) — <one-line description>
```

---

## Voice

- **Second person, present tense.** "You'll get a confirmation email."
- **Imperative steps.** "Add the secret to your repository," not "You should add the secret."
- **Action-shaped headings.** Every H2 names what the reader is doing. The page title is also action-shaped.
- **Acknowledge workarounds.** If the guide depends on a third-party service or a temporary path, say so.

## Length

400–1,200 words plus code blocks. Over 1,500 words: ask whether it's actually two guides.

## Branching

Guides can branch where tutorials cannot. Use tabs or sub-sections when the reader genuinely has different valid paths. Don't manufacture branching where one clear path serves most readers.

## Checklist before publishing

- [ ] `description` frontmatter is present and reads well in isolation (120–160 chars).
- [ ] Page title and section headings are action-shaped.
- [ ] The guide is genuinely cross-cutting; single-capability content belongs on the concept page.
- [ ] Workaround or third-party dependency stated up front if applicable.
- [ ] Prerequisites are complete and accurate.
- [ ] Code blocks are language-tagged; `title` attributes used for file content.
- [ ] Screenshots match the current state of the UI (labels, buttons, and layout match what the guide describes).
- [ ] Verify section present where the result isn't obvious.
- [ ] No marketing language, no manufactured complexity, no rehashed concept content.
