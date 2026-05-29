# Tutorial page template

A tutorial is a teaching page. The reader is new to the product or the feature, and we walk them through a working example end to end. They finish having done something real, with a concrete result they can see.

A tutorial is not a how-to. A how-to assumes the reader knows what they want to do; a tutorial assumes they're new and need the experience of using the feature once before they can do it on their own.

**Use for:** pages in Get started, and any page that introduces a feature through a guided walkthrough.  
**Don't use for:** procedures for readers who already know what they're doing (guide), conceptual explanations (concept), or schema and rule lookups (reference).

---

## Skeleton

```markdown
---
description: <One sentence summary, 120–160 chars. Used for SEO and AI retrieval. Required.>
---

# <Page title>

What the reader will do on this page, in plain language. One paragraph, two to four sentences.
Tell them what they'll have at the end.

Don't start with "In this tutorial, we will..." Start with the thing they'll do.
Example: "Deploy a Serverpod app to Cloud and see it running on a public URL."

## Before you start

- <Prerequisite 1 — link to install page, or concrete state, or external account>
- <Prerequisite 2>
- <Prerequisite 3>

## <Step 1: action-shaped heading>

One or two sentences explaining what this step does and why.

<command or action>

<expected output or result>

## <Step 2: action-shaped heading>

<as above>

## What you've done

Two to four sentences. Recap what they accomplished, then point them to the next thing:
a Concepts page to deepen understanding, or a Guide for the next task.
```

---

## Voice

- **Second person, present tense.** "You'll see the deployment status print to the terminal."
- **Direct steps, not options.** One path through the feature. Variants belong in Concepts or Reference.
- **Show real output.** Don't paraphrase. Trim long output but show the actual format.
- **Action-shaped headings.** "Deploy your project" beats "Deployment".

## Length

400–800 words plus code blocks. Readable in 5–10 minutes, doable in 15–30 minutes. Shorter suggests it's a how-to; longer suggests it should be split.

## Code samples

- Use real values, not placeholders, where possible. `my-app` beats `your-project-name`.
- One language per code block.
- Always tag the language fence (`bash`, `dart`, `yaml`, etc.).
- Use the `title` attribute when the block represents a specific file.

## Checklist before publishing

- [ ] The reader can complete the tutorial on a clean machine following only this page.
- [ ] Every step has a verifiable result.
- [ ] `description` frontmatter is present and reads well in isolation (120–160 chars).
- [ ] Headings are action-shaped.
- [ ] Prerequisites are complete and accurate.
- [ ] Code blocks are language-tagged; `title` attributes used for file content.
- [ ] Screenshots match the current state of the UI (labels, buttons, and layout match what the tutorial describes).
- [ ] Admonitions used sparingly and at the right severity level.
- [ ] No marketing language, no hedging, no concept dumps.
- [ ] Length is in the 400–800 word target range (excluding code blocks).
