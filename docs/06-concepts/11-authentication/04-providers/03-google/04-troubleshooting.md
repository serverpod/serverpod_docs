# Troubleshooting

This page helps you identify common Sign in with Google failures, explains why they occur, and shows how to resolve them. For platform-specific issues with the underlying Flutter package, see the [google_sign_in_android troubleshooting guide](https://pub.dev/packages/google_sign_in_android#troubleshooting).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

#### Google Cloud

- [ ] Create a **Google Cloud project** in the [Google Cloud Console](https://console.cloud.google.com/).
- [ ] Enable the **People API** in your project.
- [ ] In **Google Auth Platform**, complete the initial setup (wizard) and add the required scopes on **Data Access** (`.../auth/userinfo.email` and `.../auth/userinfo.profile`).
- [ ] On **Branding** ([Branding](https://console.cloud.google.com/auth/branding)), complete the OAuth consent screen (logo, homepage, privacy policy, terms of service, and developer contact) and add every hostname you will use under **Authorized domains** (redirect URIs must use a listed domain).
- [ ] Add **test users** on **Audience** while in **Testing** mode ([Audience](https://console.cloud.google.com/auth/audience)), or **Publish app** when everyone should be able to sign in.
- [ ] Create a **Web application** OAuth client with **Authorized JavaScript origins** and **Authorized redirect URIs** set to your Serverpod **web server** (`http://localhost:8082` locally, not port `8080`). Copy the **Client ID** and **Client secret**.
- [ ] Add `googleClientSecret` to `config/passwords.yaml` with your client ID, client secret, and matching `redirect_uris`. For production, use the live web server URL in Google Cloud and in `production:` (or env vars) as in [Publishing to production](./setup#publishing-to-production).

#### Server

- [ ] For new or customized servers, confirm auth services and JWT are configured per [Authentication setup](../../setup#identity-providers-configuration) before adding Google.
- [ ] Add `GoogleIdpConfigFromPasswords()` to `identityProviderBuilders` in `server.dart`.
- [ ] Create a `GoogleIdpEndpoint` file in `lib/src/auth/`.
- [ ] Run `serverpod generate`, then `serverpod create-migration`, then apply migrations using `--apply-migrations`.

#### Client

- [ ] Add `client.auth.initializeGoogleSignIn()` after `client.auth.initialize()` in your Flutter app's `main.dart`.
- [ ] Surface Google sign-in in the UI with `SignInWidget` or `GoogleSignInWidget` (see [Present the authentication UI](./setup#present-the-authentication-ui)).
- [ ] Create an **iOS** OAuth client in the **same** Google Cloud project as the Web client, using the same **Bundle ID** as the app; set `GIDClientID` from the iOS client, `GIDServerClientID` to the **Web** client's ID, and add the reversed-client-ID **URL scheme** in `Info.plist` (*iOS only*).
- [ ] Create an **Android** OAuth client in the **same** project, with the same **package name** and **SHA-1** as the build you run; place `google-services.json` in `android/app/` (*Android only*).
- [ ] On **Web**, make sure **Authorized JavaScript origins** includes the browser origin where your Flutter web app runs.
- [ ] If you use the optional redirect-based web flow, create `web/auth.html` exactly as shown in the [setup guide](./setup#web).
- [ ] If you use the optional redirect-based web flow, register the full callback URL (for example `http://localhost:8082/auth.html`) under **Authorized redirect URIs** on the Web OAuth client.
- [ ] If you use the optional redirect-based web flow, call `client.auth.initializeGoogleSignIn(..., redirectUri: ...)` with the same Web application client ID and redirect URI you configured in Google Cloud.

## Sign-in fails with redirect_uri_mismatch

**Problem:** The OAuth flow fails with a `redirect_uri_mismatch` error from Google.

**Cause:** The redirect URI in your OAuth client configuration does not match the URI your app is actually using. Google requires an exact match.

**Resolution:** In the Google Auth Platform, navigate to **Clients**, select your Web application client, and verify that the URIs under **Authorized JavaScript origins** and **Authorized redirect URIs** match what your app actually uses. This error is mainly relevant when you use the optional redirect-based web flow. For local development with that flow, a common value is `http://localhost:8082/auth.html` for the redirect URI. Trailing slashes, port differences, path differences, and `http` vs `https` all count as mismatches.

Common mistakes:

* Using port `8080` (the API server) instead of the configured web callback host and port.
* Registering `http://localhost:8082` instead of `http://localhost:8082/auth.html`.
* Adding a trailing slash or using the wrong scheme.
* Not adding the actual Flutter web app origin to **Authorized JavaScript origins** when the app runs on a different host or port.

## Sign-in works for you but not for other users

**Problem:** Sign-in works for your Google account but other users get an error screen from Google saying the app is not verified or access is denied.

**Cause:** Your Google Auth Platform app is still in **Testing** mode. Only users explicitly added as test users can sign in (up to 100).

**Resolution:** Navigate to the [Audience](https://console.cloud.google.com/auth/audience) page and click **Publish App** to allow any Google account to sign in. If your app uses sensitive or restricted scopes, Google may require a verification review before publishing.

## Production redirect URIs rejected by Google

**Problem:** When adding your production domain to Authorized redirect URIs, Google rejects it with an error about unauthorized domains.

**Cause:** Your production domain is not listed under **Authorized domains** on the Branding page.

**Resolution:** Navigate to the [Branding](https://console.cloud.google.com/auth/branding) page and add your production domain (e.g., `my-awesome-project.serverpod.space`) to **Authorized domains**. Google requires redirect URIs to use domains listed here.

## Flutter web sign-in fails with origin mismatch

**Problem:** Google Sign-In on Flutter web fails with an origin mismatch error, even though the redirect URI looks correct.

**Cause:** The sign-in request starts from the browser origin where your Flutter web app is running. If that origin is not listed under **Authorized JavaScript origins**, Google rejects the request.

**Resolution:** Add the exact browser origin of your Flutter web app to **Authorized JavaScript origins** in the Google Auth Platform. If your local workflow changes ports often, pick a stable local origin for development so your Google OAuth configuration stays predictable.

For example, if your app runs from `http://localhost:3000`, add `http://localhost:3000` as an authorized JavaScript origin.

The redirect URI is a separate setting and, if you use redirect mode, should still point to your callback page, for example `http://localhost:8082/auth.html`.

## Web callback page is missing or not returning control to the app

**Problem:** Google opens the sign-in page, but after authentication the app does not complete sign-in, or the browser shows a blank callback page.

**Cause:** The `auth.html` callback page is missing, does not contain the expected `flutter_web_auth_2` script, or the registered redirect URI points somewhere else.

**Resolution:** This only applies to the optional redirect-based web flow. Create `web/auth.html` exactly as shown in the [setup guide](./setup#web), then make sure the same full URL is registered under **Authorized redirect URIs** and passed to `client.auth.initializeGoogleSignIn(..., redirectUri: ...)`.

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

**Cause:** `serverpod generate` has been run, but you didn't create or apply the accompanying database migration.

**Resolution:** Create and apply the migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

## Lightweight sign-in (One Tap) not appearing

**Problem:** You enabled `attemptLightweightSignIn: true` but the One Tap prompt never appears on Web, or the silent sign-in doesn't trigger on mobile.

**Cause:** Lightweight sign-in requires the user to have previously signed in with Google on the device and depends on platform-specific behavior from the native Google Sign-In package.

**Resolution:** This is expected behavior for first-time users. The lightweight sign-in prompt only appears for returning users where the platform supports it. The regular sign-in button remains available as a fallback. On web, this applies to the default popup / iFrame flow. If you opt into redirect mode, the interaction model is different and does not center on lightweight sign-in.

## iOS sign-in prompt doesn't show

**Problem:** Tapping the Google Sign-In button on iOS has no effect or throws an error about a missing client ID.

**Cause:** The `GIDClientID` or `GIDServerClientID` keys are missing or incorrect in `Info.plist`, or the URL scheme is not registered.

**Resolution:**

1. Open `ios/Runner/Info.plist` and verify that `GIDClientID` is set to the `CLIENT_ID` from your iOS OAuth client plist, and `GIDServerClientID` is set to the client ID from your Web application OAuth client.
2. Verify the URL scheme (`CFBundleURLSchemes`) contains the reversed client ID from the iOS plist (the `REVERSED_CLIENT_ID` value).
3. Clean the build and run again.

## Web sign-in button doesn't render

**Problem:** The Google Sign-In button doesn't appear on Web, or tapping it does nothing useful.

**Cause:** The underlying cause depends on which web mode you use. In the default popup / iFrame flow, check that the Google web setup is complete and the browser origin is authorized. In the optional redirect flow, common causes are missing initialization with `redirectUri`, a bad redirect URI, or a missing `auth.html` callback page.

**Resolution:** Verify the web setup end to end:

1. Call `client.auth.initializeGoogleSignIn(...)` during app startup.
2. If you use redirect mode, make sure `web/auth.html` exists and matches the documented contents.
3. If you use redirect mode, make sure the registered redirect URI exactly matches the URL passed as `redirectUri`.

## Google API calls fail after one hour on Web

**Problem:** Your app calls Google APIs (e.g., Calendar, Drive) using the access token from sign-in, but requests start returning `401 Unauthorized` after about an hour. This only affects the Web platform.

**Cause:** On Web, access tokens obtained through the OAuth2 flow are short-lived. If your app keeps using the same token for Google API calls after it expires, Google returns `401 Unauthorized`.

**Resolution:** When making Google API calls on Web, treat the access token as time-limited and prompt the user to authenticate again when it expires. If your app depends heavily on long-lived access to Google APIs, design that flow explicitly instead of assuming the initial sign-in token remains valid indefinitely.
