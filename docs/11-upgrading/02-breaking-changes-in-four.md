---
title: Breaking changes in 4.0
description: Every breaking API and behavior change between Serverpod 3.4 and 4.0, with the symptom that tells you it applies and the code change each one needs.
---

<!-- markdownlint-disable MD025 -->

# Breaking changes in 4.0

## Breaking changes

These changes can break code that worked on 3.4. Find the ones that apply to your project, then read only those sections. Changes to sign-in and tokens are in [Authentication changes](#authentication-changes).

| Change | Affects you if |
| --- | --- |
| [Model files use the `.spy.yaml` extension](#model-files-use-the-spyyaml-extension) | Your model files end in `.yaml` or `.yml` instead of `.spy.yaml`. |
| [Client exceptions are a sealed hierarchy](#client-exceptions-are-a-sealed-hierarchy) | Your app catches `ServerpodClientException` or checks `statusCode == -1`. |
| [Database exceptions are typed](#database-exceptions-are-typed) | Your server catches `DatabaseInsertRowException` or another row exception. |
| [Future calls run at least once](#future-calls-run-at-least-once) | You use future calls. |
| [Removed deprecated APIs](#removed-deprecated-apis) | You use the string-based future call methods, `orderDescending`, `ignoreEndpoint`, `SerializationManagerServer`, the old web widget classes, or `--mini`. |
| [Message central delivers globally by default](#message-central-delivers-globally-by-default) | You call `session.messages.postMessage` with Redis enabled, or pass `global: true`. |
| [File storage APIs are renamed](#file-storage-apis-are-renamed) | Your server uses `session.storage`, subclasses `CloudStorage`, or serves public files from native Google Cloud Storage. |
| [Google sign-in on the web uses the OAuth2 redirect flow](#google-sign-in-on-the-web-uses-the-oauth2-redirect-flow) | Your Flutter web app uses Google sign-in from `serverpod_auth_idp_flutter`. |
| [Sign-in buttons share one set of style enums](#sign-in-buttons-share-one-set-of-style-enums) | You set style arguments on sign-in buttons from `serverpod_auth_idp_flutter`. |
| [Legacy streaming endpoints are removed](#legacy-streaming-endpoints-are-removed) | Your endpoints use `StreamingSession`. |
| [Insights database endpoints are disabled by default](#insights-database-endpoints-are-disabled-by-default) | Your own tooling calls the Insights database endpoints. |
| [The `columnOverride` experimental feature is removed](#the-columnoverride-experimental-feature-is-removed) | You pass `--experimental-features columnOverride`. |
| [`Session.close()` returns `Future<void>`](#sessionclose-returns-futurevoid) | Your code uses the value that `session.close()` returns. |
| [Unused email exceptions are removed](#unused-email-exceptions-are-removed) | Your app catches `EmailAccountRequestAlreadyExistsException` or `EmailPasswordResetAccountNotFoundException`. |

### Model files use the `.spy.yaml` extension

In 4.0, model files must use the `.spy.yaml` extension. The `.spy.yml` and `.spy` extensions are also accepted. Serverpod ignores files in `lib/src/models` or `lib/src/protocol` that have a plain `.yaml` or `.yml` extension. The `serverpod generate` and `serverpod start` commands stop with an error that lists those files:

```text
Model files must use the .spy.yaml extension. The following files are ignored:
  lib/src/models/company.yaml
Rename the files to use the .spy.yaml extension and run the command again.
```

Rename the files and run `serverpod generate` again. The contents do not change.

### Client exceptions are a sealed hierarchy

The `ServerpodClientException` class is sealed and carries only `message`. When the app can't reach the server, the call throws `ServerpodClientNetworkException`. When the server returns an error response, the call throws a subclass of the sealed `ServerpodClientHttpException`, which owns `statusCode`. Code that checks `statusCode == -1` for connection failures no longer compiles. See [Error handling and exceptions](../concepts/endpoints-and-apis/error-handling-and-exceptions#handle-errors-in-your-app).

### Database exceptions are typed

The `DatabaseInsertRowException`, `DatabaseUpdateRowException`, `DatabaseDeleteRowException`, and `DatabaseUpsertRowException` classes are replaced by `DatabaseUnexpectedResultException`. Constraint failures throw `DatabaseUniqueViolationException` or `DatabaseForeignKeyViolationException`. SQLite lock failures throw `SqliteDatabaseLockedException`. All three are subclasses of `DatabaseQueryException`. See [Database exceptions](../concepts/data-and-the-database/database/exceptions).

### Future calls run at least once

In 3.4, Serverpod removed a future call from the database before running it, so a crash mid-run lost the call. In 4.0, Serverpod removes the call only after it finishes. If a crash interrupts the call, the call runs again, possibly on another server instance. Make each future call safe to run more than once, for example by checking whether an email was already sent before sending it. See [Execution guarantees](../concepts/scheduling/overview#execution-guarantees).

### Removed deprecated APIs

- The future call methods on `Serverpod` are removed: `registerFutureCall`, `futureCallWithDelay`, `futureCallAtTime`, and `cancelFutureCall`. The `invoke` method you overrode on `FutureCall` is removed too. Calls already scheduled under an old string name match no generated call, so Serverpod doesn't run them and reports them as [broken future calls](../concepts/scheduling/configuration#broken-future-calls). To port a string-registered call:
  - Replace the `invoke` override with a public `Future<void>` method that takes a `Session` as its first parameter. See [Define a future call](../concepts/scheduling/future-calls#define-a-future-call).
  - Delete the `registerFutureCall` line from `server.dart`, and run `serverpod generate`.
  - Schedule with `pod.futureCalls.callWithDelay` or `pod.futureCalls.callAtTime`, and cancel with `pod.futureCalls.cancel`. See [Schedule a call](../concepts/scheduling/future-calls#schedule-a-call) and [Cancel scheduled calls](../concepts/scheduling/future-calls#cancel-scheduled-calls).
- The `orderDescending` parameter on ORM methods is removed. You can no longer construct `Order` directly. Use `column.asc()` and `column.desc()`. See [Sorting](../concepts/data-and-the-database/database/sorting).
- The `ignoreEndpoint` annotation is removed. Use `@doNotGenerate`. See [Exclude an endpoint from generation](../concepts/endpoints-and-apis#exclude-an-endpoint-from-generation).
- The `SerializationManagerServer` class is removed. Use the generated `Protocol` class instead. It now extends `DatabaseSerializationManager` from `serverpod_database`.
- The deprecated web-server widget aliases are removed. Rename them:
  - `AbstractWidget` to `WebWidget`
  - `Widget` to `TemplateWidget`
  - `WidgetList` to `ListWidget`
  - `WidgetJson` to `JsonWidget`
  - `WidgetRedirect` to `RedirectWidget`
- If a widget extends `WebWidget` directly, implement the new abstract `String render({String? Function(String)? onMissingVariable})` method. The `WidgetRoute` class builds the response from `render` instead of `toString`. Widgets that extend `TemplateWidget`, `ListWidget`, `JsonWidget`, or `RedirectWidget` inherit `render`. The `WidgetRoute.build` method now returns `Future<WebWidget?>`. A `null` return yields a 404. See [Server-side HTML](../concepts/web-server/server-side-html#creating-a-widgetroute).
- The `RouteStaticDirectory` and `PathCacheMaxAge` classes are removed. Serve directories with `StaticRoute.directory`, and set cache headers with its `cacheControlFactory` parameter. See [Static files](../concepts/web-server/static-files#cache-control).
- The `--mini` flag on `serverpod create` is removed. To create a project without a database, deselect **Database (recommended)** on the setup screen, or pass `--no-interactive --no-database`. To create a project without a Flutter app, use `--template server`.

### Message central delivers globally by default

Calls to `session.messages.postMessage` now default to `MessageScope.auto`. When Redis is enabled, the message goes through Redis to every server instance. Otherwise, the message stays local. If your code relied on local-only delivery, pass `scope: MessageScope.local`. The `global: true` argument is removed, so replace it with `scope: MessageScope.global`. See [Message scope](../concepts/endpoints-and-apis/server-events#message-scope).

### File storage APIs are renamed

Several `session.storage` methods are renamed in 4.0. The methods that return a single file or URL now throw instead of returning `null`. Update your server code as follows:

| 3.4 | 4.0 |
| --- | --- |
| `getPublicUrl` returns `Uri?` | `publicDownloadUrl` returns `Uri` |
| `getPublicUrls` | `publicDownloadUrls` |
| `retrieveFile` returns `ByteData?` | `retrieveFile` returns `ByteData` |
| `storeFile` takes `expiration` and `preventOverwrite` | `storeFile` takes `options: StoreFileOptions(...)` |
| `createDirectFileUploadDescription` returns `String?` and takes `expirationDuration`, `maxFileSize`, `contentLength`, and `preventOverwrite` | `createUploadDescription` returns `String` and takes `options: UploadOptions(...)` |
| `verifyDirectFileUpload` | `verifyUpload` |

Catch the new exceptions where your code checked for `null`:

- **No file at the path:** the `retrieveFile` and `publicDownloadUrl` methods throw `CloudStorageFileNotFoundException`. The new `statFile` and `temporaryDownloadUrl` methods throw it too.
- **No public URLs:** the `publicDownloadUrl` method throws `CloudStorageUnsupportedOperationException` when the storage doesn't serve public URLs, for example the default `private` storage.

Both exceptions extend `CloudStorageException`. The `publicDownloadUrls` method still returns `null` for each path that fails.

If you subclass `CloudStorage`, make these changes:

- Override the renamed methods under their new names, and add `statFile` and `temporaryDownloadUrl`.
- Throw `CloudStorageFileNotFoundException` from `retrieveFile`, `publicDownloadUrl`, and `temporaryDownloadUrl` when a file is missing. Throw it from `statFile` too, because the `CloudStorage` base class now implements `fileExists` by calling `statFile`.
- Drop the `verified` argument from `storeFile`, and take a `StoreFileOptions` parameter in place of `expiration`.
- Take an `UploadOptions` parameter in `createUploadDescription`, in place of `expirationDuration` and `maxFileSize`. Return a `BinaryUploadDescription` or a `MultipartUploadDescription` instead of a `String`.
- Move the logic from `storeFileWithOptions` and `createDirectFileUploadDescriptionWithOptions` into `storeFile` and `createUploadDescription`, because the `CloudStorageWithOptions` mixin and the `CloudStorageOptions` class are removed.

If the app uploads or downloads through the built-in `/serverpod_cloud_storage` URL, extend `DatabaseCloudStorage`. That URL rejects other storages. If the subclass keeps bytes outside the database, also override `storeUnverifiedFile`, `retrieveFileWithStat`, and `fileExists`. The URL calls the first two. The `DatabaseCloudStorage` version of `fileExists` checks the database instead of calling `statFile`. See [Store files on local disk](../concepts/endpoints-and-apis/custom-cloud-storage#store-files-on-local-disk).

If you serve public files from `NativeGoogleCloudStorage`, make the bucket itself publicly readable, because Serverpod 4.0 no longer makes each uploaded file public. For example, turn on uniform bucket-level access and grant `allUsers` the Storage Object Viewer role.

App code that uses `FileUploader` doesn't change. See [File uploads](../concepts/endpoints-and-apis/file-uploads) and [Custom cloud storage](../concepts/endpoints-and-apis/custom-cloud-storage#implement-the-cloudstorage-methods).

### Google sign-in on the web uses the OAuth2 redirect flow

If your Flutter web app uses Google sign-in from `serverpod_auth_idp_flutter`, sign-in now redirects the browser to a callback page. The legacy `serverpod_auth` module is unaffected.

When Serverpod serves your Flutter web app, update the setup:

1. Register a `FlutterWebAuth2CallbackRoute` on the web server. Its full URL is the callback URL, for example `http://localhost:8082/auth/callback`.
2. Pass the callback URL to `initializeGoogleSignIn` as `redirectUri`. Also pass the client ID as `clientId`, or set `GOOGLE_CLIENT_ID` with `--dart-define`. The web flow doesn't read the `google-signin-client_id` meta tag in `web/index.html`.
3. Add the full callback URL in two places: under **Authorized redirect URIs** on the server OAuth client, and in `redirect_uris` in the `googleClientSecret` entry of `passwords.yaml`. In 3.4, both places held the bare origin, for example `http://localhost:8082`.

See [Google web setup](../concepts/authentication/providers/google/setup#web).

If the app runs on its own origin, for example with `flutter run -d chrome`, skip step 1, because the browser blocks the route's callback across origins. Place an `auth.html` file in the app's `web/` folder instead. In steps 2 and 3, use that file's URL, for example `http://localhost:49660/auth.html`. See [Separately-hosted Flutter web](../concepts/authentication/providers/google/customizations#separately-hosted-flutter-web).

### Sign-in buttons share one set of style enums

If you set style arguments on a sign-in button from `serverpod_auth_idp_flutter` or `serverpod_auth_idp_flutter_facebook`, update them. The legacy `serverpod_auth` module is unaffected.

- **All providers:** use the shared `SignInButtonSize`, `SignInButtonShape`, `SignInButtonLogoAlignment`, and `SignInButtonTextVariant` enums. The per-provider style types, such as `GSIButtonSize` and `AppleSignInStyle`, are removed.
- **Apple and Facebook:** pass `text` instead of `type`.
- **GitHub, Google, and Microsoft:** remove the `type` argument.
- **Google:** pass a `GoogleButtonStyle` as `style` instead of `theme`, and remove `getButtonText`, `locale`, and `buttonWrapper`.

To style every button inside `SignInWidget` at once, pass a `SignInButtonStyle` as `buttonStyle`. See [Styling the buttons](../concepts/authentication/ui-components#styling-the-buttons).

<details>
<summary>Removed style types by provider</summary>
<p>

- **Apple:** `AppleButtonSize`, `AppleButtonText`, `AppleButtonShape`, `AppleButtonLogoAlignment`, and `AppleSignInStyle`.
- **Facebook:** `FacebookButtonSize`, `FacebookButtonText`, `FacebookButtonShape`, `FacebookButtonLogoAlignment`, and `FacebookSignInStyle`.
- **GitHub:** `GitHubButtonType`, `GitHubButtonSize`, `GitHubButtonText`, `GitHubButtonShape`, `GitHubButtonLogoAlignment`, and `GitHubSignInStyle`.
- **Google:** `GSIButtonType`, `GSIButtonTheme`, `GSIButtonSize`, `GSIButtonText`, `GSIButtonShape`, `GSIButtonLogoAlignment`, and `GoogleSignInStyle`.
- **Microsoft:** `MicrosoftButtonType`, `MicrosoftButtonSize`, `MicrosoftButtonText`, `MicrosoftButtonShape`, `MicrosoftButtonLogoAlignment`, and `MicrosoftSignInStyle`.

</p>
</details>

### Legacy streaming endpoints are removed

Serverpod's legacy streaming endpoints API was deprecated in 3.0 and is removed in 4.0. Endpoints that use the `StreamingSession` type no longer compile. The related server and client methods are gone too, for example `streamOpened`, `streamClosed`, `handleStreamMessage`, `sendStreamMessage`, `getUserObject`, `setUserObject`, and `openStreamingConnection`.

Port code that uses the legacy API to [streaming methods](../concepts/endpoints-and-apis/streaming). With streaming methods, the endpoint declares `Stream` parameters and return types, and Serverpod manages the connection. State that used to live in a user object becomes a local variable in the streaming method. The method stays alive as long as the stream is open. The old API stays documented in [Streaming endpoints](./archive/streaming-endpoints) while you port.

### Insights database endpoints are disabled by default

In 4.0, the Insights server endpoints that give direct database access are disabled by default: `fetchDatabaseBulkData`, `runQueries`, `getDatabaseRowCount`, and `executeSql`. They throw an `AccessDeniedException` until you enable them. The Insights app doesn't use these endpoints, so most projects need no change.

If you have custom tooling that calls them through the `serverpod_service_client` package, opt in per environment. Set `enableDatabaseAccess` in the `insightsServer` block of the config file, or set the `SERVERPOD_INSIGHTS_SERVER_ENABLE_DATABASE_ACCESS` environment variable:

```yaml
insightsServer:
  port: 8081
  publicHost: localhost
  publicPort: 8081
  publicScheme: http
  enableDatabaseAccess: true
```

The `hotReload`, `getOpenSessionLog`, and `shutdown` Insights methods are removed. See [Insights](../tools/insights#database-access) for details.

### The `columnOverride` experimental feature is removed

The `column` keyword no longer needs an experimental feature, so `columnOverride` is removed. Remove `--experimental-features columnOverride` from your commands and scripts, because the flag stops the CLI with a usage error that reports `"columnOverride" is not in all|databaseSync`. Serverpod ignores a `columnOverride` entry under `experimental_features` in `<project>_server/config/generator.yaml`, so you can delete the entry. See [Column name override](../concepts/data-and-the-database/database/tables#column-name-override).

### `Session.close()` returns `Future<void>`

The `Session.close()` method returns `Future<void>` instead of `Future<int?>`. It no longer returns an ID when Serverpod logs the session to the database. Code that uses the returned value no longer compiles. A plain `await session.close();` still works.

### Unused email exceptions are removed

The email identity provider's `EmailAccountRequestAlreadyExistsException` and `EmailPasswordResetAccountNotFoundException` classes are removed. Nothing threw them in 3.4, so the app sees the same responses as before. Remove any `catch` clause or `case` that names them.

## Authentication changes

Version 4.0 changes a few authentication behaviors that can affect existing apps:

- **The `?auth=` query parameter is no longer accepted.** HTTP calls authenticate through the `Authorization` header, or an auth cookie on the web. Streaming connections authenticate when the stream opens. Upgrade any client from before 4.0 that relied on the query parameter.
- **Signing in on top of another account is rejected.** When a token is issued for a different user from an already-authenticated session, Serverpod throws a `SignInWhileAuthenticatedException` on every platform. Users must sign out before switching accounts. Server code that creates tokens on behalf of another user calls the token manager's `createToken` instead, for example in an admin flow. The `createToken` method skips the sign-in policy and returns the secrets in the response body.
- **Method streams close when the signed-in user changes.** On sign-in and sign-out, open method streams close gracefully on all platforms. Their subscriptions receive `onDone` without an error. New streams connect with the current identity. A token refresh for the same identity keeps streams running.
- **If you use Firebase sign-in, unverified emails are accepted by default.** The default `firebaseAccountDetailsValidation` no longer rejects accounts whose email is not verified. To keep the 3.4 behavior, pass `firebaseAccountDetailsValidation: FirebaseIdpConfig.requireVerifiedEmail`. The app then receives a `FirebaseEmailNotVerifiedException` for those accounts. In 3.4, the same case surfaced as a `FirebaseIdTokenVerificationException`, so update error handling that checks for the old exception. See [Custom account validation](../concepts/authentication/providers/firebase/configuration#custom-account-validation).
- **If you enable cookie auth for the web, list every browser origin.** The new `authCookie` configuration requires you to list every browser origin in `allowedOrigins`. A browser on an origin that isn't listed loses cross-origin access, including to public endpoints. See [web authentication](../concepts/authentication/web-authentication).
- **If you wrote a custom token manager, extend the base class.** The `TokenIssuer` and `TokenManager` classes are now base classes. Implement `createToken` to create the token itself, and leave `issueToken` alone. The `issueToken` method is non-virtual. It applies the sign-in policy and cookie delivery for every token type.
- **If you wrote a custom identity provider, implement `IdentityProvider`.** The `IdentityProviderBuilder` class now requires a provider that implements `IdentityProvider`. A provider class written for 3.4 must add a `method` getter and a `mergeAuthUsers` method. Replace any `static const String method` with the getter, because a class can't declare a static and an instance member with the same name. Give each provider a unique, non-empty `method`, or Serverpod throws a `StateError` when you register the provider. See [the provider class](../concepts/authentication/providers/custom-providers/oauth2-utility/creating-an-oauth2-based-identity-provider#3-provider-class).

### If you use the legacy auth module

The legacy `serverpod_auth` packages ship 4.0 releases. Bump every `serverpod_auth` package your project uses to the same version as Serverpod itself, in the same `pubspec.yaml` files:

```yaml
dependencies:
  serverpod_auth_server: 4.0.0          # in the server package
  serverpod_auth_client: 4.0.0          # in the client package
  serverpod_auth_shared_flutter: 4.0.0  # in the Flutter package
```

The `authenticationKeyManager` parameter on the generated `Client` was removed in 4.0. Assign the key manager to the `authKeyProvider` field instead:

```dart
client = Client('http://$ipAddress:8080/')
  ..authKeyProvider = FlutterAuthenticationKeyManager()
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

If you use legacy Sign in with Apple, set `appleClientIds` on `AuthConfig`, because Sign in with Apple is disabled until it's set. See [Apple sign-in](../concepts/authentication/legacy/providers/apple#server-side-configuration).

The legacy module keeps working on 4.0, so you can upgrade without moving to the new authentication framework. To make that move, finish this upgrade first, then see [Migrate from legacy auth](./migrate-from-legacy-auth).

### If you use the new auth module on Android

The `serverpod_auth_core_flutter` package now requires `flutter_secure_storage` 10.0.0 or newer and allows 11.x. Most projects already resolve 10.x and are not affected.

If your Flutter app is still on 9.x, you have two options:

- **Upgrade directly to 11.x.** Version 11 dropped the code that migrates data written by 9.x, so users on Android are signed out and have to sign in again.
- **Upgrade to 10.x first.** Users stay signed in when you upgrade from 9.x to 10.x, and again from 10.x to 11.x, because each step keeps the session. Release a 10.x build, let it reach your users, then move to 11.x.

Projects created with `serverpod create` pin 10.x with a dependency override. To do the same, add this to the Flutter app's `pubspec.yaml`:

```yaml
dependency_overrides:
  flutter_secure_storage: ^10.0.0
```

Version 11 also requires `compileSdk = 37` in `android/app/build.gradle.kts`. That value is higher than the current Flutter default.
