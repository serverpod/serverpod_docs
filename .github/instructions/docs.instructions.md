---
applyTo: "docs/**,versioned_docs/**,cloud_docs/**"
---

# Docs quality instructions

Apply these rules when writing new documentation or reviewing existing pages. The goal is the same in both cases: get the reader to a working outcome with minimum friction.

## Creating a new page

Before writing a new page or section, ask the user whether it is a **concept**, **guide**, **tutorial**, or **reference** page. Then follow the skeleton and rules in the matching template:

- Concept — `.github/doc-templates/concept.md`
- Guide — `.github/doc-templates/guide.md`
- Tutorial — `.github/doc-templates/tutorial.md`
- Reference — `.github/doc-templates/reference.md`

---

## Structure rules

- **`description` frontmatter is required** on every page. It must be a single sentence, 120–160 characters, that reads well in isolation (used for SEO meta description and AI retrieval).
- **Omit the `title` frontmatter field.** Docusaurus generates the page title from the first `#` heading; including both causes markdownlint to flag a duplicate.
- **The first `#` heading** should be descriptive but short. For guides and tutorials it should be action-shaped ("Set up GitHub sign-in"). For concepts and reference pages it should be noun-shaped ("Passwords", "Custom domains").
- **Use `sidebar_label`** frontmatter when a page title is too long for the sidebar. It should be a shorter version of the title, not a different title.
---

## Principles

1. **One default path.** Each procedure follows one clear path. Advanced alternatives and edge cases belong in a Customizations or separate advanced section, not inline.
2. **Say what to do, not why defaults are sensible.** If the reader should leave a setting on, say so. Don't explain the security reasoning behind GitHub's token expiration policy.
3. **The reader's task drives the page.** Every sentence either moves the reader forward or is cut. Background, comparisons, and history that don't help the reader act are noise.

---

## Review checks

When reviewing an existing page, also check for:

- **Missing steps.** Is every required action explicitly stated? Would a Flutter developer with no backend experience know what to do next?
- **Assumed knowledge.** Does the page use a term, concept, or tool without introducing it or linking to where it's explained? Flag any assumption that isn't basic Flutter or Dart knowledge.
- **Skipped prerequisites.** Is there something the reader must have set up or installed before this step that the page doesn't mention? If a prerequisite involves steps in an external service, link to a maintained guide for those steps — a bare link to the service's homepage is not enough.
- **Screenshot drift.** Do screenshots match the current state of the UI? Flag any screenshot where labels, buttons, or layout differ from what the guide describes.

Basic Flutter knowledge (widgets, `main()`, `pubspec.yaml`, or Flutter code examples) can be assumed without explanation.

---

## Noise patterns

Each pattern has a name, a definition, a bad example, and a good example.

### 1. Form validation noise

Repeating field constraints, character limits, or required/optional labels that the interface the reader is looking at (GitHub, Serverpod console, any third-party UI) already enforces or displays.

❌ `**GitHub App name** (required, up to 34 characters, unique across GitHub).`  
✅ `**GitHub App name**`

### 2. Comparison jargon

Explaining a concept by comparing it to another concept the reader likely doesn't know.

❌ `GitHub Apps use fine-grained permissions instead of OAuth scopes.`  
✅ `For sign-in you only need access to the user's profile.`

### 3. Forward references in procedure steps

Mentioning terms from a later section as if they orient the reader, before the reader has any context for them.

❌ `The callback URL must match the redirect URI you pass to initializeGitHubSignIn in your Flutter app.`  
✅ `The callback URL is where GitHub redirects the user after they authorize your app.`

_(Link or refer back once the term is introduced later in the page.)_

### 4. Reasoning padding

Explaining the rationale behind a setting the reader just needs to leave alone.

❌ `Leave **Expire user authorization tokens** enabled. Token expiration is recommended for sign-in flows so leaked tokens have a short useful lifetime.`  
✅ `Leave **Expire user authorization tokens** enabled. Serverpod handles token refresh automatically.`

### 5. Implementation detail exposure

Surfacing internal class names, system APIs, or package internals the reader doesn't need to know to complete the task.

❌ `The flutter_web_auth_2 package handles the redirect using ASWebAuthenticationSession.`  
✅ `No special configuration is needed for a standard custom-scheme callback URL.`

### 6. Misplaced admonitions

Tips or notes about a topic not directly relevant to the step the reader is on. An admonition that could be removed without the reader missing a required action is noise.

❌ A `:::tip` in the GitHub callback URL step explaining reverse-DNS naming conventions for iOS/Android app schemes.  
✅ Remove it. The table already shows `com.example.yourapp://auth` as the example value.

### 7. Ecosystem comparisons

Comparing the service or tool being set up to an alternative mid-procedure, when the reader is already on a specific setup path and the comparison doesn't change what they do.

❌ A note explaining the difference between GitHub Apps and OAuth Apps in the middle of the GitHub App setup flow.  
✅ Remove. If the reader needs to choose between the two, surface that decision in prerequisites — before the procedure starts.

### 8. Manufactured branching in the main flow

Offering two valid paths inside the core procedure when one is the default for most readers and the other is an advanced or uncommon case.

❌ Main setup section presenting both Serverpod-hosted web and separately-hosted web as equal paths with inline sub-sections.  
✅ Follow the default (Serverpod-hosted) path in the main flow. Put the separately-hosted variant in a Customizations page or a clearly labelled advanced section at the bottom.

### 9. Redundant qualifiers

Words or phrases that state what's already obvious from context.

❌ `Sign in with GitHub uses OAuth2 credentials from a GitHub App registered on GitHub.`  
✅ `Sign in with GitHub uses OAuth2 credentials from a GitHub App.`

❌ `The flutter_web_auth_2 package handles the OAuth2 redirect on every platform under the hood.`  
✅ `The GitHub identity provider uses flutter_web_auth_2 to handle the OAuth2 redirect.`

### 10. Internal mechanics exposure

Describing how the framework or widget wires itself up internally when the reader only needs to know what to call or where to put something.

❌ `SignInWidget auto-detects which identity provider endpoints are registered on the server, so once GitHubIdpEndpoint is exposed and client has been generated, the GitHub button appears.`  
✅ `Once GitHubIdpEndpoint is registered and your app reloads, the GitHub sign-in button appears automatically.`

### 11. Facts that belong in external docs

Stating specific facts about a third-party service that we don't own and would have to maintain if they change. Link to the authoritative source instead.

❌ `GitHub Apps allow up to 10 callback URLs (OAuth Apps allow only one).` — this is a GitHub product detail; if GitHub changes it, our docs silently become wrong.  
✅ Remove it, or if necessary to complete the task, link to GitHub's documentation for service-specific limits, and state only what the reader needs to do.

### 14. Version history noise

Describing old Serverpod behavior in a current task page. The reader is completing a task with the current version; what the framework used to do is irrelevant unless they are migrating.

❌ `In previous versions of Serverpod the insert method mutated the input object by setting the id field. In the example above the input variable remains unmodified after the insert/insertRow call.`  
✅ Remove it. The code example already demonstrates current behavior. If an upgrade note is needed, it belongs in the version upgrade guide.

### 15. Concept preamble on a task page

Opening with multiple sentences explaining what a feature *is* and *why it exists*, before the first step. One short orienting sentence is acceptable; more delays the reader's first action.

❌ Four-sentence explanation of what middleware is and why it's useful, before any code appears on a page whose job is to show how to add middleware.  
✅ One sentence: `Middleware runs before and after your route handlers, making it suitable for logging, API key validation, and CORS.` Then show the first step.

Deeper concept explanation belongs on a dedicated concept page, not at the top of a task page.

### 16. Obvious constraint restatement

Stating API preconditions that Dart's type system or the runtime already enforces. Keep only constraints that are *silent* (produce wrong behavior without a compile error or exception) or require out-of-code setup.

❌ `The object that you update must have its id set to a non-null value and the id needs to exist on a row in the database.` — `id` is typed `int?`; passing `null` is a compile-time type error.  
❌ `At least one column must be specified in the columnValues parameter, otherwise an ArgumentError will be thrown.` — an empty list throws immediately with a descriptive error.  
✅ Remove both. Silent constraints — for example, a `deleteWhere` filter that matches more rows than the reader expects — are worth calling out.

---

## Admonition guidelines

Use admonitions sparingly. Before adding one, ask: does the reader need this to complete the task?

- `:::warning` — use when a step has consequences the reader could miss (data loss, a secret exposed, a migration required).
- `:::note` — use for a narrow exception that applies to some readers (not all), where the main flow doesn't cover it.
- `:::tip` — almost never. If the tip is important, it belongs in the main body. If it isn't, cut it. Never wrap a substantial code example in a `:::tip` block — promote it to a labelled `## Advanced` section at the bottom of the page or move it to a dedicated page.

Never use an admonition to deliver content that belongs in a different section or a different page.
