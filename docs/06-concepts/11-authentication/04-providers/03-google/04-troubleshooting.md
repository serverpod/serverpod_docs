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
- [ ] Add the `google-signin-client_id` **meta tag** to `web/index.html` (*Web only*).
- [ ] On **Web**, list **both** the Serverpod web server origin (e.g., `http://localhost:8082`) and your Flutter app origin under **Authorized JavaScript origins** on the Web OAuth client; use a **fixed** `--web-port` for Flutter so that second origin does not change every run (see [Web setup](./setup#web)).

## Sign-in fails with redirect_uri_mismatch

**Problem:** The OAuth flow fails with a `redirect_uri_mismatch` error from Google.

**Cause:** The redirect URI in your OAuth client configuration does not match the URI your app is actually using. Google requires an exact match.

**Resolution:** In the Google Auth Platform, navigate to **Clients**, select your Web application client, and verify that the URIs under **Authorized JavaScript origins** and **Authorized redirect URIs** match your server's address exactly. For local development, both should be `http://localhost:8082` (the Serverpod **web server** port, not the API server port 8080). Trailing slashes, port differences, and `http` vs `https` all count as mismatches.

Common mistakes:

* Using port `8080` (the API server) instead of `8082` (the web server). Check `config/development.yaml` under `webServer` for the correct port.
* Adding a trailing slash (e.g., `http://localhost:8082/` instead of `http://localhost:8082`).
* For Web apps: not adding the Flutter web app's origin (e.g., `http://localhost:49660`) to **Authorized JavaScript origins**. This is separate from the Serverpod web server address. See the [Web setup section](./setup#web) for details.

## Sign-in works for you but not for other users

**Problem:** Sign-in works for your Google account but other users get an error screen from Google saying the app is not verified or access is denied.

**Cause:** Your Google Auth Platform app is still in **Testing** mode. Only users explicitly added as test users can sign in (up to 100).

**Resolution:** Navigate to the [Audience](https://console.cloud.google.com/auth/audience) page and click **Publish App** to allow any Google account to sign in. If your app uses sensitive or restricted scopes, Google may require a verification review before publishing.

## Production redirect URIs rejected by Google

**Problem:** When adding your production domain to Authorized redirect URIs, Google rejects it with an error about unauthorized domains.

**Cause:** Your production domain is not listed under **Authorized domains** on the Branding page.

**Resolution:** Navigate to the [Branding](https://console.cloud.google.com/auth/branding) page and add your production domain (e.g., `my-awesome-project.serverpod.space`) to **Authorized domains**. Google requires redirect URIs to use domains listed here.

## Flutter web sign-in fails with origin mismatch

**Problem:** Google Sign-In on Flutter web fails with an origin mismatch error, even though you added `http://localhost:8082` to the OAuth client.

**Cause:** The Flutter web app runs on a different port than the Serverpod web server. The sign-in request originates from the Flutter app's port (e.g., `http://localhost:49660`), which also needs to be listed in **Authorized JavaScript origins**. Flutter also picks a random port by default, so the origin changes on every run.

**Resolution:** Run Flutter on a fixed port and add that origin to your OAuth client:

```bash
flutter run -d chrome --web-hostname localhost --web-port=49660
```

Then add `http://localhost:49660` to **Authorized JavaScript origins** in the Google Auth Platform.

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

**Cause:** Lightweight sign-in requires the user to have previously signed in with Google on this device or browser. It also depends on platform-specific conditions: on Web, FedCM or One Tap must be supported by the browser; on mobile, the user must have a Google account configured on the device.

**Resolution:** This is expected behavior for first-time users. The lightweight sign-in prompt only appears for returning users. If the user dismisses One Tap multiple times, Google may suppress it temporarily. The regular sign-in button remains available as a fallback.

## iOS sign-in prompt doesn't show

**Problem:** Tapping the Google Sign-In button on iOS has no effect or throws an error about a missing client ID.

**Cause:** The `GIDClientID` or `GIDServerClientID` keys are missing or incorrect in `Info.plist`, or the URL scheme is not registered.

**Resolution:**

1. Open `ios/Runner/Info.plist` and verify that `GIDClientID` is set to the `CLIENT_ID` from your iOS OAuth client plist, and `GIDServerClientID` is set to the client ID from your Web application OAuth client.
2. Verify the URL scheme (`CFBundleURLSchemes`) contains the reversed client ID from the iOS plist (the `REVERSED_CLIENT_ID` value).
3. Clean the build and run again.

## Web sign-in button doesn't render

**Problem:** The Google Sign-In button doesn't appear on Web, or the page shows a JavaScript error related to Google Identity Services.

**Cause:** The `google-signin-client_id` meta tag is missing from `web/index.html`, or its value doesn't match the server's Web application client ID.

**Resolution:** Add or verify the meta tag in `web/index.html`:

```html
<head>
  ...
  <meta name="google-signin-client_id" content="your_server_client_id">
</head>
```

Replace `your_server_client_id` with the `client_id` from your Web application OAuth client JSON file.

## Google API calls fail after one hour on Web

**Problem:** Your app calls Google APIs (e.g., Calendar, Drive) using the access token from sign-in, but requests start returning `401 Unauthorized` after about an hour. This only affects the Web platform.

**Cause:** On Web, the `accessToken` returned by the `google_sign_in` package expires after 3,600 seconds (one hour) and is not automatically refreshed.

**Resolution:** When making Google API calls on Web, check the token age and prompt the user to re-authenticate if the token has expired. On mobile platforms, the token is refreshed automatically and this is not an issue. See the [google_sign_in_web documentation](https://pub.dev/packages/google_sign_in_web) for details on token lifecycle.
