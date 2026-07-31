---
sidebar_label: Troubleshooting
description: Sign in with Facebook failures, from the JavaScript SDK toggle to iOS tracking permission and Android key hashes, and how to diagnose and resolve each one.
---

# Troubleshoot Facebook sign-in

This page helps you identify common Sign in with Facebook failures, explains why they occur, and shows how to resolve them. For underlying issues with the native SDK, see the [flutter_facebook_auth package](https://pub.dev/packages/flutter_facebook_auth).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

#### Facebook App Dashboard

- [ ] Created an app with the **Authenticate and request data from users with Facebook Login** use case at [Facebook for Developers](https://developers.facebook.com/apps).
- [ ] Requested the permissions you need under **Use cases** > **Customize** > **Permissions and features** (`email` and `public_profile` are enough for basic sign-in).
- [ ] For web and macOS: set **Login with the JavaScript SDK** to **Yes** and added every serving origin to **Allowed Domains for the JavaScript SDK**.
- [ ] Copied the **App ID** and **App secret** (**App settings** > **Basic**) and the **Client token** (**App settings** > **Advanced**).
- [ ] Switched the app to **Live** mode (or added your account as a tester) so non-role users can sign in.

#### Server

- [ ] Added `facebookAppId` and `facebookAppSecret` to `config/passwords.yaml` under the matching environment (`development:` for local, `production:` for prod), or set the matching `SERVERPOD_PASSWORD_facebookAppId` and `SERVERPOD_PASSWORD_facebookAppSecret` environment variables.
- [ ] Added `FacebookIdpConfigFromPasswords()` to `identityProviderBuilders` in `server.dart`.
- [ ] Created a `FacebookIdpEndpoint` file in `lib/src/auth/`.
- [ ] Started the server with `serverpod start`, then created and applied the migration (pressed **M**, then **A**).

#### Client

- [ ] Installed the `serverpod_auth_idp_flutter_facebook` package.
- [ ] Called `client.auth.initializeFacebookSignIn()` after `client.auth.initialize()` in your Flutter app's `main.dart`.
- [ ] On **web** and **macOS**, supplied the App ID (directly or via the `FACEBOOK_APP_ID` dart-define).
- [ ] On **Android**, added `strings.xml` with the app ID, protocol scheme, and client token, plus the `<meta-data>` and `<queries>` entries in `AndroidManifest.xml`, and registered the debug or release key hash on the Facebook app.
- [ ] On **iOS**, added the `CFBundleURLTypes`, `FacebookAppID`, `FacebookClientToken`, and `LSApplicationQueriesSchemes` entries to `Info.plist`.

## Web sign-in fails with "JSSDK Option is Not Toggled"

**Problem:** On web (or macOS), clicking the Facebook button fails immediately with a message like "JSSDK Option is Not Toggled. Please toggle the Login with Javascript SDK Option to Yes in developers.facebook.com".

**Cause:** Web and macOS sign-in use the Facebook JavaScript SDK, which the app must explicitly opt into. It is off by default on a new app.

**Resolution:** In the [Facebook App Dashboard](https://developers.facebook.com/apps), go to **Use cases** > **Customize** > **Settings**, set **Login with the JavaScript SDK** to **Yes**, and save. See [Settings](./setup#2-settings).

## Web sign-in is blocked by CORS or the domain is not allowed

**Problem:** The Facebook popup does not load, or the browser console shows a CORS error or "can't load URL: the domain of this URL isn't included in the app's domains".

**Cause:** The origin serving your Flutter web app is not listed in **Allowed Domains for the JavaScript SDK**.

**Resolution:** Add every serving origin to **Use cases** > **Customize** > **Settings** > **Allowed Domains for the JavaScript SDK**, including `https://www.facebook.com`, your development origin (e.g., `http://localhost:8082`), and your production domain. The Facebook JavaScript SDK only works over `https` in production; `localhost` over `http` loads but logs a console warning. See [Web](./setup#web).

## iOS sign-in fails after denying tracking permission

**Problem:** On iOS, Facebook sign-in fails or the server cannot read the user's profile, especially after the user declines the App Tracking Transparency (ATT) prompt.

**Cause:** When ATT permission is not granted, Facebook may issue a **limited access token**. Limited tokens cannot be validated by the server or used to fetch profile data, so authentication fails.

**Resolution:** Request ATT authorization before starting the Facebook sign-in flow, for example with the [`app_tracking_transparency`](https://pub.dev/packages/app_tracking_transparency) package:

```dart
import 'package:app_tracking_transparency/app_tracking_transparency.dart';

final status = await AppTrackingTransparency.requestTrackingAuthorization();
```

See [iOS](./setup#ios) for the full iOS configuration.

## Android opens Facebook but the sign-in never completes

**Problem:** On Android, tapping the Facebook button opens the login flow, but after authorizing, the app returns an error or the session is never established.

**Cause:** The key hash registered on the Facebook app does not match the keystore that signed the build, or the `strings.xml` / `AndroidManifest.xml` entries are missing or wrong.

**Resolution:**

1. Confirm `android/app/src/main/res/values/strings.xml` contains `facebook_app_id`, `fb_login_protocol_scheme` (your app ID prefixed with `fb`), and `facebook_client_token`.
2. Confirm the `com.facebook.sdk.ApplicationId` and `com.facebook.sdk.ClientToken` `<meta-data>` entries and the `com.facebook.katana.provider.PlatformProvider` `<queries>` entry are in `AndroidManifest.xml`.
3. Register the key hash for the keystore you are building with. Generate the debug hash with:

   ```bash
   keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
   ```

   Add the output under the Android platform in the Facebook app. For release builds, generate and add the release keystore's hash too. See [Android](./setup#android).

## Sign-in works for you but not for other users

**Problem:** Sign-in works for your own Facebook account but other users get an error saying the app is not available or is still in development.

**Cause:** The Facebook app is in **Development mode**, which only allows people with a role on the app (admins, developers, testers) to sign in.

**Resolution:** Switch the app to **Live** mode at the top of the [Facebook App Dashboard](https://developers.facebook.com/apps), or add the specific users as testers under **App roles**. Going Live requires a Privacy Policy URL and, for permissions beyond `email` and `public_profile`, App Review. See [Publishing to production](./setup#publishing-to-production).

## Sign-in succeeds but the user has no email

**Problem:** The user signs in successfully, but the server-side `FacebookAccountDetails.email` value is `null`.

**Cause:** Users can decline to share their email during the Facebook login flow, or the `email` permission was not requested. A custom validator that requires an email will then block the sign-in.

**Resolution:**

- Confirm the `email` permission is requested (it is included by default; see [Accessing Facebook APIs](./customizations#accessing-facebook-apis)).
- If you do not strictly need an email, keep the default validator, which only checks `userIdentifier`. Avoid rejecting accounts without an email unless you must. See [Custom account validation](./customizations#custom-account-validation).
- Surface a helpful message to the user instead of failing silently.

## Server crashes on startup with a missing password

**Problem:** The server crashes on startup with a `PasswordNotFoundException` for `facebookAppId` or `facebookAppSecret`.

**Cause:** The keys are missing from `config/passwords.yaml`, are spelled differently, or are not present under the active environment section.

**Resolution:** Confirm both keys exist under the section matching your run mode (`development:` when running locally, `production:` when deployed):

```yaml
development:
  facebookAppId: 'your-facebook-app-id'
  facebookAppSecret: 'your-facebook-app-secret'
```

Quotes are required because the values are strings. On Serverpod Cloud, set them with `scloud password set` instead. See [Publishing to production](./setup#publishing-to-production).

## Server crashes on first Facebook sign-in with "no such table"

**Problem:** The server builds and starts, but crashes when a user tries to sign in with Facebook. The error cites a missing table such as `serverpod_auth_idp_facebook_account`.

**Cause:** The database migration that creates the provider's tables was never created or applied.

**Resolution:** In the running `serverpod start` terminal, press **M** to create the migration, then **A** to apply it. See [Start the server](./setup#start-the-server).

## Sign-in works in dev but fails after deploy

**Problem:** Facebook sign-in works locally but fails in production.

**Cause:** The production domain is not registered on the Facebook app, the app is still in Development mode, or the production Flutter build was not given the App ID.

**Resolution:**

1. Add your production domain to **Allowed Domains for the JavaScript SDK** (web and macOS) and register the release key hash (Android).
2. Switch the app to **Live** mode.
3. Confirm the production server has `facebookAppId` and `facebookAppSecret` set, and that the production web build passes `--dart-define=FACEBOOK_APP_ID=...`. See [Publishing to production](./setup#publishing-to-production).
