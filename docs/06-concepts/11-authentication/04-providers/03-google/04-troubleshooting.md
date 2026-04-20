# Troubleshooting

This page helps you identify common Sign in with Google failures, explains why they occur, and shows how to resolve them. For platform-specific issues with the underlying Flutter package, see the [google_sign_in_android troubleshooting guide](https://pub.dev/packages/google_sign_in_android#troubleshooting).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

* [ ] Create a **Google Cloud project** in the [Google Cloud Console](https://console.cloud.google.com/).
* [ ] Enable the **People API** in your project.
* [ ] Configure the **Google Auth Platform** with the required scopes (`.../auth/userinfo.email` and `.../auth/userinfo.profile`).
* [ ] Add your email as a **test user** on the [Audience](https://console.cloud.google.com/auth/audience) page.
* [ ] Create a **Web application** OAuth client and download its JSON file.
* [ ] Paste the JSON contents into `googleClientSecret` in `config/passwords.yaml`.
* [ ] Run **`serverpod generate`**, then **`serverpod create-migration`**, then apply migrations using `--apply-migrations`.
* [ ] Create an **iOS** OAuth client and configure `Info.plist` with `GIDClientID`, `GIDServerClientID`, and the URL scheme (*iOS only*).
* [ ] Create an **Android** OAuth client with the correct SHA-1 fingerprint and place `google-services.json` in `android/app/` (*Android only*).
* [ ] Add the `google-signin-client_id` **meta tag** to `web/index.html` (*Web only*).

## Sign-in fails with `redirect_uri_mismatch`

**Problem:** The OAuth flow fails with a `redirect_uri_mismatch` error from Google.

**Cause:** The redirect URI in your OAuth client configuration does not match the URI your app is actually using. Google requires an exact match.

**Resolution:** In the Google Auth Platform, navigate to **Clients**, select your Web application client, and verify that the URIs under **Authorized JavaScript origins** and **Authorized redirect URIs** match your server's address exactly. For development, both should include `http://localhost:8082`. Trailing slashes, port differences, and `http` vs `https` all count as mismatches.

## Sign-in fails on Android with `PlatformException(sign_in_failed)` or `clientConfigurationError`

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

## `google-services.json` missing web client entry

**Problem:** Sign-in fails on Android with an error about a missing server client ID, or `serverClientId` is null.

**Cause:** The `google-services.json` file does not contain a web OAuth client entry. This happens when no Web application OAuth client exists in the same Google Cloud project.

**Resolution:** Make sure you have created a Web application OAuth client in the same project as your Android OAuth client. Re-download `google-services.json` after creating the Web client. Alternatively, provide client IDs programmatically as described on the [configuration page](./configuration#configuring-client-ids-on-the-app).

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
