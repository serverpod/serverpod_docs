# Troubleshooting

This page helps you identify common Sign in with Apple failures, explains why they occur, and shows how to resolve them. For Apple's full list of OAuth error codes, see [TN3107: Resolving Sign in with Apple response errors](https://developer.apple.com/documentation/technotes/tn3107-resolving-sign-in-with-apple-response-errors).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

#### Apple Developer Portal

* [ ] Enable **Sign in with Apple** on your App ID at [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
* [ ] Create a **Service ID** and link it to your App ID (*Android and Web only*).
* [ ] Confirm the **return URL** on the Service ID uses `https://` (not `http://` or `localhost`).
* [ ] Create a **Sign in with Apple key** and download the `.p8` file.

#### Server

* [ ] Add the Apple credentials to `config/passwords.yaml` with the raw `.p8` file contents (not a pre-generated JWT).
* [ ] Double-check the **`.p8` key** is indented consistently under `appleKey: |`.
* [ ] Add `AppleIdpConfigFromPasswords()` to `identityProviderBuilders` in `server.dart`.
* [ ] Call **`pod.configureAppleIdpRoutes(...)`** on the server before the pod starts.
* [ ] Create an `AppleIdpEndpoint` file in `lib/src/auth/`.
* [ ] Run **`serverpod generate`**, then apply migrations using `--apply-migrations`.

#### Client

* [ ] Add `client.auth.initializeAppleSignIn()` after `client.auth.initialize()` in your Flutter app's `main.dart`.
* [ ] Add **Sign in with Apple** under Signing & Capabilities in Xcode (*iOS/macOS only*).
* [ ] Add the **Apple JS SDK** script to `web/index.html` (*Web only*).
* [ ] Pass **`APPLE_SERVICE_IDENTIFIER`** and **`APPLE_REDIRECT_URI`** via `--dart-define` (*Web and Android only*).
* [ ] Add the **`signinwithapple`** intent filter to `AndroidManifest.xml` (*Android only*).
* [ ] Add **Apple's mail servers** to your SPF record if you email users who might use Hide My Email.

## Sign-in fails with `invalid_client` every time

**Problem:** Every authentication attempt gives an `invalid_client` error from Apple.

**Cause:** The `appleKey` value in `passwords.yaml` is not indented correctly. The key gets corrupted during parsing. The server starts without error, but Apple sees an invalid signature.

**Resolution:** Paste the raw `.p8` key under `appleKey` with consistent indentation. All lines of the key must line up with the one that starts `-----BEGIN PRIVATE KEY-----`. For example:

```yaml
appleKey: |
  -----BEGIN PRIVATE KEY-----
  MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
  -----END PRIVATE KEY-----
```

Alternatively, set `appleKey` via the `SERVERPOD_PASSWORD_appleKey` environment variable to avoid YAML indentation entirely.

## Sign-in starts failing with `invalid_client` after months of success

**Problem:** Sign-in was working for months, then suddenly fails with `invalid_client` and you haven't changed code.

**Cause:** `appleKey` has a pre-generated client secret JWT, not the raw `.p8` key. Apple makes JWTs expire after six months. When it expires, all sign-ins fail.

**Resolution:** Replace any JWT in `appleKey` with the raw `.p8` private key (include the full header and footer). Serverpod will create fresh short-lived JWTs automatically. No need to handle JWTs yourself. See [Creating a client secret](https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret).

## Sign-in fails with `invalid_grant`

**Problem:** Authentication fails with an `invalid_grant` error from Apple.

**Cause:** Apple's authorization codes are single-use and expire after approximately 10 minutes. This error occurs when:

* The authorization code was already exchanged (e.g. the request was retried after a network failure).
* The server clock is significantly out of sync, causing the client secret JWT to appear expired before Apple processes it.
* The identity token nonce does not match what the server expects.

**Resolution:**

* Do not retry requests that carry an Apple authorization code. If the flow fails, restart it from the beginning.
* Ensure your server's system clock is synchronized via NTP. A drift of more than a few seconds will cause JWT validation to fail on Apple's side.
* If the nonce mismatch is the cause, verify that the nonce generated on the client matches what the server uses during token validation.

## Wrong identifier passed for web or Android sign-in

**Problem:** Sign-in on Android or Web fails immediately, or Apple returns `invalid_client` / `invalid_request` even though credentials look correct.

**Cause:** There are two separate identifiers in Apple's system and they are easy to mix up:

* **App ID** (`bundleIdentifier`) -- the bundle identifier of your iOS/macOS app (e.g. `com.example.app`). Used for native Apple platform sign-in only.
* **Services ID** (`serviceIdentifier`) -- a separate identifier you create in the Apple Developer Portal specifically for web and Android OAuth (e.g. `com.example.service`). This acts as the OAuth client ID.

Passing the App ID bundle identifier where the Services ID is expected will cause Apple to reject the request.

**Resolution:** Check `passwords.yaml` and confirm:

* `appleServiceIdentifier` is set to your **Services ID** (the one created under Identifiers → Services IDs).
* `appleBundleIdentifier` is set to your **App ID** bundle identifier.

If you use `--dart-define`, confirm `APPLE_SERVICE_IDENTIFIER` is the Services ID, not the bundle ID.

## Sign-in hangs on Android

**Problem:** The OAuth flow opens a browser, but never returns to the app. Sign-in seems to finish but the app doesn't get the callback.

**Cause:** The `signinwithapple` URI scheme isn't registered in `AndroidManifest.xml`, so Android drops the callback.

**Resolution:** Add this activity to `AndroidManifest.xml`:

```xml
<activity
  android:name="com.linusu.flutter_web_auth_2.CallbackActivity"
  android:exported="true">
  <intent-filter android:label="flutter_web_auth_2">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="signinwithapple" />
  </intent-filter>
</activity>
```

## Server crashes on first Apple sign-in with "no such table"

**Problem:** The server builds and starts, but crashes when a user tries Apple sign-in. The error cites a missing table (like `serverpod_auth_idp_apple_account`).

**Cause:** `serverpod generate` has been run, but you didn't create or apply the accompanying database migration.

**Resolution:** Create and apply the migration:

```bash
serverpod generate
dart run bin/main.dart --apply-migrations
```

## Apple rejects the redirect URI with `invalid_request`

**Problem:** The web OAuth flow fails with `invalid_request` and Apple's error page says the redirect URI is invalid.

**Cause:** You're using HTTP instead of HTTPS for the redirect. Apple requires HTTPS and does not allow `localhost`.

**Resolution:** Always use an HTTPS URL for your redirect. For local development, run your server behind an HTTPS tunnel. Register the tunneled `https://` URL as your return URL in Apple's Developer Portal, and update `appleRedirectUri` in `passwords.yaml` to match.

## Emails aren't delivered to some users

**Problem:** Transactional emails (password resets, notifications) work for most people, but some never receive them.

**Cause:** Some users chose Apple's "Hide My Email" during sign-in. Mail to relay addresses like `@privaterelay.appleid.com` fails if your domain's SPF record doesn't include Apple's mail servers.

**Resolution:** Add Apple's mail servers to your SPF record. See [Configure private email relay service](https://developer.apple.com/help/account/configure-app-capabilities/configure-private-email-relay-service/) for SPF settings and instructions.

## User email is `null` after sign-in

**Problem:** The user's email is missing or `null` after sign in, or it's present on first sign-in but missing after that.

**Cause:** Apple sends the email address and name only once, during initial authorization. After that, only the `sub` claim is provided. If you didn't save the email the first time, you can't get it again unless the user disconnects and reconnects your app.

**Resolution:** Make sure your server stores the user's email on their first sign-in. Use `sub` as the main user identifier, not email (which can change if the user updates Hide My Email). See [Authenticating users with Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/authenticating-users-with-sign-in-with-apple).

## iOS sign-in prompt doesn't show

**Problem:** Tapping the Sign in with Apple button on iOS has no effect, or the Apple authentication UI never appears.

**Cause:** The App ID isn't set up with the Sign in with Apple capability, or your Xcode project isn't using that App ID.

**Resolution:**

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), find your App ID. Check that **Sign in with Apple** is enabled under Capabilities.
2. In Xcode, select your target, open **Signing & Capabilities**, and check that **Sign in with Apple** is listed. If not, click **+ Capability** to add it.
3. Download and install your new provisioning profile if needed.

## Sign-in does not work in the iOS Simulator

**Problem:** Sign in with Apple silently fails or the native authentication sheet does not appear when running in the iOS Simulator, but works fine on a physical device.

**Cause:** Some Simulator versions do not fully support the native Sign in with Apple flow. This is a known Simulator limitation, not a code or configuration issue.

**Resolution:** Test on a physical device to confirm the problem is Simulator-specific. If sign-in works on a real device, no changes are needed.

## Web sign-in fails with `TypeError: type ... is not a subtype of type 'JSObject'`

**Problem:** Clicking the Apple button on Web throws a `TypeError` mentioning `JSObject` or a minified type like `minified:CM`.

**Cause:** The Apple JS SDK is not loaded. The `sign_in_with_apple` package calls `AppleID.auth.init()` on the page, but that function only exists after Apple's script is loaded in the HTML.

**Resolution:** Add the Apple JS SDK to your Flutter app's `web/index.html` inside the `<head>` tag:

```html
<script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" crossorigin="anonymous"></script>
```

The `crossorigin="anonymous"` attribute is needed because Flutter's service worker sets a strict Cross-Origin Embedder Policy that blocks scripts without it.

## macOS sign-in shows "Sign Up Not Completed"

**Problem:** The native Sign in with Apple sheet appears on macOS, but immediately shows "Sign Up Not Completed" without completing authentication.

**Cause:** The macOS app sandbox entitlement conflicts with `ASAuthorizationController`. When `com.apple.security.app-sandbox` is enabled alongside `com.apple.developer.applesignin`, the authorization flow fails silently.

**Resolution:** In your macOS entitlements file (e.g., `macos/Runner/DebugProfile.entitlements`), remove the app sandbox entitlement or ensure it does not block the Sign in with Apple flow. Test without the sandbox first to confirm it is the cause, then re-add only the sandbox entitlements you need.

## User stays signed in after removing Apple access

**Problem:** A user removes your app from Apple ID settings (`Settings > [your name] > Sign-In & Security > Sign in with Apple > Stop Using Apple ID`) but is still logged in to your app.

**Cause:** Your server receives Apple's revocation notification but doesn't terminate the user's active sessions.

**Resolution:** When you receive a revocation notification at the route set using `pod.configureAppleIdpRoutes(revokedNotificationRoutePath: ...)`, look up the user by the `sub` value in the payload and invalidate all their sessions. See [Processing changes for Sign in with Apple accounts](https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts) for how the notification works.
