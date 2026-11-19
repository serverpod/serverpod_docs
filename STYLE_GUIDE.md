# Serverpod writing style guide

## 1. Write for technical, hands-on teams

Our audience is CTOs, lead developers, and Flutter teams building production apps. Write like a senior engineer talking to another senior engineer.

Rules:

- Be clear and direct.
- Avoid hype and vague claims.
- Be specific and concrete.
- Respect the reader’s intelligence.
- Acknowledge real technical tradeoffs without exaggerating.

Examples:

Weak: A next-generation backend solution for modern apps.\
Strong: Build your backend in Dart, deploy with zero configuration, and keep full control of your stack.

Weak: A powerful and robust platform.\
Strong: An open-source backend framework for Flutter teams who want full-stack type safety in Dart.

Weak: Managing infrastructure is a nightmare.\
Strong: Switching between Dart on the frontend and another language on the backend adds unnecessary cognitive load.

Weak: Supercharge your backend journey.\
Strong: Deploy your backend without touching a single config file.

### Words to avoid

The following words add length without adding meaning, or sound marketing-inflected in technical prose. Replace them with the plain version.

| Avoid | Use instead |
| --- | --- |
| robust | reliable |
| seamless | smooth |
| powerful | (cut it, or say what it does) |
| intuitive | (cut it, or say what it does) |
| leverage | use |
| facilitate | help, allow |
| enables you to X | lets you X / you can X |

---

## 2. Terminology and naming consistency

- Always capitalize **Serverpod** (proper noun).
- Always write **Serverpod Cloud** with both words capitalized.
- Always write the advocacy program as **Serverpod Voyager - Developer Expert Program** (exact capitalization and hyphenation).
- Use consistent core terminology. Prefer “backend framework” or “full-stack Dart framework” over mixing with “platform,” “solution,” or “BaaS,” unless context clearly requires it. Prefer “open-source backend framework” when emphasizing positioning, and avoid inventing new category terms.

### Canonical product phrases

Use these preferred terms consistently across the website, docs, and marketing:

- “Type-safe APIs” (not “typed APIs” or “strongly typed endpoints”).
- “Full-stack type safety” when referring to end-to-end Dart integration.
- “Zero-configuration deployments” when referring to Serverpod Cloud.
- “Streaming endpoints” for real-time functionality (not “real-time sockets” unless technically necessary).
- “Modules” or “built-in modules” are used when describing reusable functionality.
- “Open-source backend framework for Flutter” when positioning against alternatives.

Avoid introducing new labels for the same concepts unless there is a clear technical distinction.

---

## 3. Headlines

- Use sentence case.
- Do not capitalize every word.
- Capitalize proper nouns only.

Correct:

- Build your backend in Dart
- Real-time features without the chaos
- Why Flutter teams choose Serverpod

Incorrect:

- Build Your Backend In Dart
- Real-Time Features Without The Chaos

---

## 4. Oxford comma

Always use the Oxford comma in lists.

Correct: Authentication, streaming endpoints, and a built-in ORM.\
Incorrect: Authentication, streaming endpoints and a built-in ORM.

---

## 5. Lists and periods

When bullet points are full sentences, end each one with a period.

Correct:

- Serverpod is fully open source.
- It offers zero-configuration deployments.
- It provides type-safe APIs.

If bullet points are fragments, do not mix them with full sentences.

Correct:

- Open source
- Zero-configuration deployments
- Type-safe APIs

Incorrect:

- Open source
- It offers zero-configuration deployments.
- Type-safe APIs

---

## 6. Referring to other tools

- Do not attack competitors.
- Avoid emotional or dismissive language.
- Position Serverpod through clarity and tradeoffs, not negativity.

Avoid: Firebase is broken and overpriced.\
Prefer: If you want predictable pricing and open-source flexibility, Serverpod offers a compelling alternative.

---

## 7. Calls to action

Use calm, confident, and technical CTAs.

Good:

- Get started with Serverpod.
- Explore the documentation.
- Deploy your first backend in minutes.

Avoid:

- Don’t miss out!
- Act now!
- Limited time only!

---

## 8. Em dashes and colons

Avoid em dashes (—) in running text. They are hard to read aloud and almost always signal a sentence that should be split or rephrased. Rewrite the sentence with a comma, a parenthesis, a word that names the relation (such as "because" or "so"), or two sentences.

Avoid: `Call initializeAuthServices before pod.start — this registers the token managers.`\
Prefer: `Call initializeAuthServices before pod.start. This registers the token managers.`

Don't replace an em dash with a colon. A colon that joins two clauses reads as machine-written, and it hides how the two halves relate. Use a colon only after a bold lead-in in a list, or at the end of a sentence that introduces a list, table, or code block.

Avoid: `Those checks are cheap: for an unchanged file, your server sends a 304 response.`\
Prefer: `When a file hasn't changed, your server sends a 304 response, so those checks cost little.`

---

## 9. Screenshots

Take screenshots in the light theme, so they match the rest of the docs. In the Serverpod Cloud console, switch the theme to light first.

Crop each screenshot to what the reader needs to find, with enough around it to show where it is on the screen.

---

## 10. Serverpod Cloud console

The console shows the reader what each screen does. The docs cover what it can't show, so they stay correct when the console changes.

- **Explain what the console can't show.** For each feature, say what it is for, when to use it, what it causes (such as suspension, resets, or charges), its limits, and the CLI command that does the same.
- **Locate a console step in one line.** Say where the feature lives, for example "under **Environment variables** in the project's **Env & Passwords** tab", and add only what the screen doesn't make obvious. Don't walk through the form field by field, because the reader can see the fields and the steps go stale when the console changes.
- **Document every capability.** A screen that explains itself is no reason to leave a feature out. The docs feed AI search and list what Serverpod Cloud can do.
- **Add a screenshot only where an entry point or a state is hard to find.** The text still names the page and the control, so the step works without the image.
