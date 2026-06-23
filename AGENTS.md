# Serverpod documentation

This is the documentation for Serverpod, an open-source backend for Flutter written in Dart. The documentation is built with Docusaurus.

## Rules

- When writing documentation, always follow the instructions in the STYLE_GUIDE.md.
- Do NOT attempt to run `npm run build` or similar, instead ask the user for verification.
- When linking to other pages in the documentation use this format: `[Working with endpoints](./concepts/working-with-endpoints)`. This will ensure that the links work within the same version of the docs.
- When writing or reviewing documentation, apply the patterns in `.github/instructions/docs.instructions.md`.

## Who reads these docs

The majority of readers are Flutter developers. They range from developers new to backend and full-stack concepts to experienced engineers. Do not assume knowledge of server-side patterns, database configuration, OAuth flows, or deployment infrastructure unless the current page has already introduced it. Basic Flutter and Dart knowledge can be assumed.

Three types of readers, in order of priority:

**The Evaluator** — deciding whether to use Serverpod or Serverpod Cloud. New to the product, needs to reach a working outcome fast. Blocked by unfamiliar terms, unclear scope, and setup paths that assume too much.

**The Builder** — actively shipping with Serverpod. Knows the basics, needs to find the answer to a specific task quickly. Blocked by scattered information and missing happy paths.

**The Operator** — running real workloads, hitting real friction. Needs precise, trustworthy reference. Blocked by undocumented edge cases and content that doesn't match what the system actually does.

The same person moves through all three stages. Write for the stage they're in right now, not the one they'll eventually reach.

## The governing principle

Get the reader to a working outcome with minimum friction. Every sentence should either move them forward or be cut.
