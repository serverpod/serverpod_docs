---
sidebar_label: Troubleshooting
description: Sign in with Google failures, from setup mistakes to platform-specific errors, and how to diagnose and resolve each one in your Serverpod app.
---

# Troubleshoot Google sign-in

This page helps you identify common Sign in with Google failures, explains why they occur, and shows how to resolve them. For platform-specific issues with the underlying Flutter package, see the [google_sign_in_android troubleshooting guide](https://pub.dev/packages/google_sign_in_android#troubleshooting).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

#### Google Cloud

- [ ] Create a **Google Cloud project** in the [Google Cloud Console](https://console.cloud.google.com/).
- [ ] Enable the **People API** in your project.
- [ ] In **Google Auth Platform**, complete the initial setup (wizard) and add the required scopes on **Data Access** (`.../auth/userinfo.email` and `.../auth/userinfo.profile`).
- [ ] On **Branding** ([Branding](https://console.cloud.google.com/auth/branding)), complete the OAuth consent screen (logo, homepage, privacy policy, terms of service, and developer contact) and add the **root domain** (top private domain) under **Authorized domains**. Google stores only the root, so a single verified entry covers all of its subdomains. On Serverpod Cloud, add `serverpod.space` (already verified by Serverpod, no DNS setup needed). For custom domains, see [Verify your authorized domain](./setup#1-verify-your-authorized-domain).
- [ ] Add **test users** on **Audience** while in **Testing** mode ([Audience](https://console.cloud.google.com/auth/audience)), or **Publish app** when everyone should be able to sign in.
- [ ] Create a **Web application** OAuth client. For web sign-in, set **Authorized JavaScript origins** to your Flutter web app's origin (e.g., `https://my-awesome-project.serverpod.space`) and **Authorized redirect URIs** to the route URL from [Web setup](./setup#web) (e.g., `https://my-awesome-project.serverpod.space/auth/callback`), or the `auth.html` URL if you use the [separately-hosted Flutter web](./customizations#separately-hosted-flutter-web) fallback (e.g., `http://localhost:49660/auth.html`). Copy the **Client ID** and **Client secret**.
- [ ] Add `googleClientSecret` to `config/passwords.yaml` with your client ID, client secret, and matching `redirect_uris` (the same callback URL as above). For production, this is the route URL you registered via `FlutterWebAuth2CallbackRoute` (e.g., `https://my-awesome-project.serverpod.space/auth/callback`) from [Web setup](./setup#web), or the production `auth.html` URL on your Flutter web host if you use the [separately-hosted Flutter web](./customizations#separately-hosted-flutter-web) fallback; see [Publishing to production](./setup#publishing-to-production).

#### Server

- [ ] For new or customized servers, confirm auth services and JWT are configured per [Authentication setup](../../setup#identity-providers-configuration) before adding Google.
- [ ] Add `GoogleIdpConfigFromPasswords()` to `identityProviderBuilders` in `server.dart`.
- [ ] Create a `GoogleIdpEndpoint` file in `lib/src/auth/`.
- [ ] Start the server with `serverpod start`, then create and apply the migration (press **M**, then **A**).

#### Client

- [ ] Add `client.auth.initializeGoogleSignIn()` after `client.auth.initialize()` in your Flutter app's `main.dart`. On web, pass `clientId` and `redirectUri` (the full callback URL, either the route URL or the `auth.html` URL, depending on your [Web setup](./setup#web)).
- [ ] Surface Google sign-in in the UI with `SignInWidget` or `GoogleSignInWidget` (see [Present the authentication UI](./setup#present-the-authentication-ui)).
- [ ] Create an **iOS** OAuth client in the **same** Google Cloud project as the Web client, using the same **Bundle ID** as the app; set `GIDClientID` from the iOS client, `GIDServerClientID` to the **Web** client's ID, and add the reversed-client-ID **URL scheme** in `Info.plist` (*iOS only*).
- [ ] Create an **Android** OAuth client in the **same** project, with the same **package name** and **SHA-1** as the build you run; place `google-services.json` in `android/app/` (*Android only*).
- [ ] Set up the web callback (*Web only*). Pick one:
  - **Standard:** Register `FlutterWebAuth2CallbackRoute` on `pod.webServer` in `server.dart` before `pod.start()` per [Web setup](./setup#web).
  - **Separately-hosted fallback:** Create `web/auth.html` in your Flutter project as described in [Web callback page (`auth.html`)](../../setup#web-callback-page-authhtml) and run Flutter on a **fixed** `--web-port` so the origin does not change every run. See [separately-hosted Flutter web](./customizations#separately-hosted-flutter-web).

## Sign-in fails with redirect_uri_mismatch

**Problem:** The OAuth flow fails with a `redirect_uri_mismatch` error from Google.

**Cause:** The redirect URI sent during sign-in does not exactly match one of the URIs registered on the Web OAuth client. Google requires an exact match (scheme, host, port, path, and casing).

**Resolution:** In the Google Auth Platform, navigate to **Clients**, select your Web application client, and verify that the URIs under **Authorized JavaScript origins** and **Authorized redirect URIs** match what your app actually uses:

- **Authorized JavaScript origins** must contain your Flutter web app's origin (e.g., `http://localhost:49660` locally, `https://my-awesome-project.serverpod.space` in production).
- **Authorized redirect URIs** must contain the full callback URL: the route URL from [Web setup](./setup#web) (e.g., `https://my-awesome-project.serverpod.space/auth/callback`), or the full `auth.html` URL if you use the [separately-hosted Flutter web](./customizations#separately-hosted-flutter-web) fallback (e.g., `http://localhost:49660/auth.html` locally).

The same callback URL must also appear:

- In `config/passwords.yaml` under `googleClientSecret.web.redirect_uris`.
- In `client.auth.initializeGoogleSignIn(..., redirectUri: ...)` in your Flutter app.

Common mistakes:

- Trailing slashes, port differences, or `http` vs `https`.
- Forgetting the callback path on the redirect URI; the bare origin is not enough.
- For separately-hosted Flutter web, the Flutter dev server running on a random port. Pass `--web-port=<port>` to `flutter run` so the origin is stable.

## Production redirect URIs rejected by Google

**Problem:** When adding your production domain to **Authorized redirect URIs** on the Web OAuth client, Google rejects it with an error about unauthorized domains.

**Cause:** The redirect URI's root domain (the top private domain) has not been verified and added to **Authorized domains** on the Branding page. Google requires the root to be a verified Authorized Domain before it accepts redirect URIs that use it.

**Resolution:** Add the root domain (e.g., `serverpod.space` or your custom root) to **Authorized domains**, then retry the redirect URI. On Serverpod Cloud, the `serverpod.space` root is already verified, so you only need to add `serverpod.space` to **Authorized domains**. For a custom domain, verify ownership at [Google Search Console](https://search.google.com/search-console) first. See [Verify your authorized domain](./setup#1-verify-your-authorized-domain).

## Sign-in works for you but not for other users

**Problem:** Sign-in works for your Google account but other users get an error screen from Google saying the app is not verified or access is denied.

**Cause:** Your Google Auth Platform app is still in **Testing** mode. Only users explicitly added as test users can sign in (up to 100).

**Resolution:** Navigate to the [Audience](https://console.cloud.google.com/auth/audience) page and click **Publish App** to allow any Google account to sign in. If your app uses sensitive or restricted scopes, Google may require a verification review before publishing.

## Sign-in callback fails locally with `flutter run -d chrome`

**Problem:** You followed [Web setup](./setup#web) and registered `FlutterWebAuth2CallbackRoute`. Sign-in completes at Google, the browser redirects, but the Flutter app never receives the result. Only affects `flutter run -d chrome` local dev.

**Cause:** The integrated route requires Serverpod and your Flutter web app to be on the **same origin** (same scheme, host, AND port). With `flutter run -d chrome`, Flutter runs on its own dev server port (e.g., `49660`) while Serverpod is on `8082` — different origins. The browser blocks the callback page's `postMessage` across origins.

**Resolution:** Use the [separately-hosted Flutter web](./customizations#separately-hosted-flutter-web) flow for local dev — it serves `auth.html` from Flutter's own dev server, same-origin with your Flutter app. For production, the integrated route works once Serverpod serves your Flutter build (template default via `FlutterRoute` on `/app`).

## Sign-in callback never returns to the Flutter app

**Problem:** The Google sign-in window completes successfully, but the Flutter app never receives the result. The browser sits on a blank page, or `signIn()` hangs.

**Cause:** The browser was redirected to a URL that does not serve the callback page, or the page is loaded but cannot post the result back to the Flutter app (origin mismatch).

**Resolution:**

1. Confirm your callback page is reachable. Open the `redirectUri` directly in a browser tab; you should see the "Authentication complete" page.

   - For the standard [Web setup](./setup#web), confirm `FlutterWebAuth2CallbackRoute` is registered on `pod.webServer` before `pod.start()` and that the path matches the URL you opened.
   - For the [separately-hosted Flutter web](./customizations#separately-hosted-flutter-web) fallback, confirm `web/auth.html` exists in your Flutter project and contains the script described in [Web callback page (`auth.html`)](../../setup#web-callback-page-authhtml). If the file is missing, the redirect URL returns a 404.

2. Confirm the `redirectUri` passed to `initializeGoogleSignIn` exactly matches the URL where the callback is served, and that both share scheme, host, and port with your Flutter web app (the browser blocks `postMessage` across origins).

## Server fails to parse googleClientSecret from passwords.yaml

**Problem:** The server crashes on startup with a JSON parsing error related to `googleClientSecret`.

**Cause:** The YAML block scalar indentation is incorrect. The `googleClientSecret` key uses `|` (literal block scalar), which requires every line of the JSON to be indented at the same level relative to the key.

**Resolution:** Make sure the JSON block is indented consistently under the `|`:

```yaml
development:
  googleClientSecret: |
    {
      "web": {
        "client_id": "...",
        "client_secret": "..."
      }
    }
```

Every line of the JSON must be indented by at least one level more than `googleClientSecret:`. Mixing tabs and spaces can also cause issues.

## Sign-in fails on Android with PlatformException(sign_in_failed) or clientConfigurationError

**Problem:** Google Sign-In throws a `PlatformException(sign_in_failed, ...)` or a `GoogleSignInException` with `clientConfigurationError` on Android but works on other platforms.

**Cause:** The SHA-1 fingerprint registered in your Android OAuth client does not match the signing key used to build the app. This commonly happens when switching between debug and release builds, or when the app is signed with a different keystore than the one registered.

**Resolution:**

1. Check which SHA-1 your debug build is using:

   ```bash
   ./gradlew signingReport
   ```

2. In the Google Auth Platform, navigate to **Clients** and verify your Android OAuth client has the correct SHA-1 fingerprint.

3. If you are testing a release build, use the SHA-1 from your production keystore:

   ```bash
   keytool -list -v -keystore /path/to/keystore
   ```

4. After updating the SHA-1, it can take a few minutes for Google to propagate the change.

## Sign-in works in debug but fails in release

**Problem:** Google Sign-In works in debug mode but fails silently or with `sign_in_failed` in a release build.

**Cause:** Debug and release builds use different signing keys. The SHA-1 fingerprint registered in your Android OAuth client only matches the debug keystore.

**Resolution:** Register the SHA-1 fingerprint from your release keystore as an additional fingerprint in the Google Auth Platform. You can add multiple SHA-1 fingerprints to the same Android OAuth client, or create separate clients for debug and release.

## Missing web client entry in google-services.json

**Problem:** Sign-in fails on Android with an error about a missing server client ID, or `serverClientId` is null.

**Cause:** The `google-services.json` file does not contain a web OAuth client entry. This happens when no Web application OAuth client exists in the same Google Cloud project.

**Resolution:** Make sure you have created a Web application OAuth client in the same project as your Android OAuth client. Re-download `google-services.json` after creating the Web client. Alternatively, provide client IDs programmatically as described on the [customizations page](./customizations#configuring-client-ids-on-the-app).

## People API not enabled

**Problem:** Sign-in completes on the client but the server returns an error when fetching user profile data. The server logs show a `403` or `PERMISSION_DENIED` error from the People API.

**Cause:** The People API is not enabled in your Google Cloud project.

**Resolution:** Navigate to the [People API page](https://console.cloud.google.com/apis/library/people.googleapis.com) and click **Enable**.

## Server crashes on first Google sign-in with "no such table"

**Problem:** The server builds and starts, but crashes when a user tries Google sign-in. The error cites a missing table (like `serverpod_auth_idp_google_account`).

**Cause:** The database migration that creates the provider's tables was never created or applied.

**Resolution:** In the running `serverpod start` terminal, press **M** to create the migration, then **A** to apply it.

## Lightweight sign-in (One Tap) not appearing

**Problem:** You enabled `attemptLightweightSignIn: true` but the One Tap prompt never appears on Web, or the silent sign-in doesn't trigger on mobile.

**Cause:** Lightweight sign-in requires the user to have previously signed in with Google on this device or browser. It also depends on platform-specific conditions: on Web, FedCM or One Tap must be supported by the browser; on mobile, the user must have a Google account configured on the device.

**Resolution:** This is expected behavior for first-time users. The lightweight sign-in prompt only appears for returning users. If the user dismisses One Tap multiple times, Google may suppress it temporarily. The regular sign-in button remains available as a fallback.

## iOS sign-in prompt doesn't show

**Problem:** Tapping the Google Sign-In button on iOS has no effect or throws an error about a missing client ID.

**Cause:** The `GIDClientID` or `GIDServerClientID` keys are missing or incorrect in `Info.plist`, or the URL scheme is not registered.

**Resolution:**

1. Open `ios/Runner/Info.plist` and verify that `GIDClientID` is set to the `CLIENT_ID` from your iOS OAuth client plist, and `GIDServerClientID` is set to the client ID from your Web application OAuth client.
2. Verify the URL scheme (`CFBundleURLSchemes`) contains the reversed client ID from the iOS plist (the `REVERSED_CLIENT_ID` value).
3. Clean the build and run again.

## clientId is required when initializing Google Sign-In on web with a redirect URI

**Problem:** The Flutter app throws an `ArgumentError` at startup saying `clientId is required when initializing Google Sign-In on web with a redirect URI`.

**Cause:** You passed `redirectUri` to `initializeGoogleSignIn` on web but did not pass `clientId` and did not set the `GOOGLE_CLIENT_ID` `--dart-define`. In redirect mode the package needs the Web OAuth client ID explicitly; it cannot derive it from anywhere else on web.

**Resolution:** Either pass `clientId` directly, or pass it via `--dart-define`:

```dart
client.auth.initializeGoogleSignIn(
  clientId: kIsWeb
      ? 'your-web-client-id.apps.googleusercontent.com'
      : null,
  redirectUri: kIsWeb
      ? 'https://my-awesome-project.serverpod.space/auth/callback'
      : null,
);
```

Or:

```bash
flutter run --dart-define=GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com ...
```

## Google API calls fail after one hour on Web

**Problem:** Your app calls Google APIs (e.g., Calendar, Drive) using the access token from sign-in, but requests start returning `401 Unauthorized` after about an hour. This only affects the Web platform.

**Cause:** On Web, the `accessToken` returned by the underlying sign-in library expires after 3,600 seconds (one hour) and is not automatically refreshed.

**Resolution:** When making Google API calls on Web, check the token age and prompt the user to re-authenticate if the token has expired. On mobile platforms, the token is refreshed automatically and this is not an issue.
