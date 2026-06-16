# Concept page template

A concept page is the home for one capability. The reader is past Get started; they want to understand what the capability is, when to use it, and how to do common operations on it. They might read top to bottom to learn, or jump to a specific section to do something.

**Use for:** pages in the Concepts section, one per capability.  
**Don't use for:** step-by-step new-user walkthroughs (tutorial), procedural how-tos spanning multiple capabilities (guide), or schema and rule lookups (reference).

---

## Skeleton

```markdown
---
description: <One sentence summary, 120–160 chars. Used for SEO and AI retrieval. Required.>
---

# <Capability name>

Two to four sentences. The order matters:

1. First sentence: a concrete reason the reader would reach for this capability. Name
   use cases or stakes they will recognise. ("Cloud collects logs so you can debug a deploy
   that broke at 3am or trace a request that took two seconds." beats "Cloud has a logging
   system.") The first sentence is what a scanner reads to decide if the page is relevant.
2. Second sentence: what the capability is and how it works at a glance. Mechanics live
   here, not in the opener.
3. (Optional) third or fourth sentence: scope, roadmap status, or a pointer to a section
   below.

Don't open with marketing or feature labels. Open with the substance.
If the capability has a roadmap item (workaround today, native support coming), say so here.

## When to use <capability>

OPTIONAL. Use when the reader has a decision to make: this vs an alternative, opt-in vs skip,
etc. Skip if every user uses the capability the same way.

Format: short paragraphs or a small decision table.

## <Operation 1: action-shaped heading>

One or two sentences on what this operation does and when the reader would do it.

<command or action>

<expected output or result>

## <Operation 2: action-shaped heading>

<as above>

## Configuration

OPTIONAL. Use when the capability has configuration knobs in scloud.yaml, environment variables,
or CLI flags that aren't tied to a single operation. Link to the Reference page for the canonical
lookup; this section is the readable explanation.

## Cloud-specific behavior

OPTIONAL. Use when Cloud handles this capability differently from self-hosted Serverpod and the
difference matters to the reader.

## Limits

OPTIONAL. Use when the capability has hard limits the reader will hit or current limitations they
should know about. Format: short list. Each item: the limit, what happens at the limit, what to
do about it.

## Troubleshooting

OPTIONAL. Use only for 2–4 well-defined failure modes the reader will plausibly hit.
Format: question-shaped headings. Each entry: cause, fix.

## Related

OPTIONAL but recommended.

- [<Linked page>](path) — <one-line description>
```

---

## Voice

- **Mixed person.** Use "you" when telling the reader what they can do; no subject when describing the capability ("Logs are collected automatically"). Don't switch within a paragraph.
- **Operations in imperative.** "Set a password," not "You should set a password."
- **Action-shaped H2s.** "Set a password" beats "Password configuration".
- **Honest about variants.** Name the variant in one sentence with a code example. Don't enumerate every flag — that's the CLI reference's job.

## Length

600–1,500 words plus code blocks. Under 400 words: consider folding into a related concept. Over 2,000 words: consider splitting.

## Code samples

If an operation has a primary form and a variant, show both in adjacent code blocks rather than commenting variants out.

## Checklist before publishing

- [ ] `description` frontmatter is present and reads well in isolation (120–160 chars).
- [ ] Overview opens with a concrete reason a reader would care, not the mechanism. Names use cases or stakes by name before describing structure.
- [ ] Roadmap status stated up front if relevant.
- [ ] Operations are action-shaped headings, ordered by how often the reader needs them.
- [ ] Code blocks are language-tagged; `title` attributes used for file content.
- [ ] Optional sections present only when the capability has the content to justify them.
- [ ] Related section is not padded.
- [ ] No marketing language, no hedging, no speculative troubleshooting.
