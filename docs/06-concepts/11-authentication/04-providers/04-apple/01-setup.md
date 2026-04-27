# Setup

Sign in with Apple requires a subscription to the [Apple Developer Program](https://developer.apple.com/programs/), even for development and testing.

:::info
The Serverpod project template (`serverpod create`) includes the auth module and JWT configuration out of the box. If you set up your project without the template, see [Setup](../../setup) first.
:::

## Get your credentials

All platforms require an App ID. Android and Web additionally require a Service ID.

| Platform | App ID | Service ID | Xcode capability | Android intent filter |
| --- | --- | --- | --- | --- |
| iOS / macOS | Required | Not needed | Required | — |
| Android | Required | Required | — | Required |
| Web | Required | Required | — | — |

### Register your App ID

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), click **Identifiers → +**.

2. Select **App IDs** and click **Continue**.

   ![Register a new identifier — App IDs selected](/img/authentication/providers/apple/4-app-id-create.png)

3. Select **App** as the type and click **Continue**.

4. Fill in a description and your app's **Bundle ID** (e.g. `com.example.app`).

5. Scroll down to **Capabilities**, find **Sign in with Apple**, and check it. Keep it set as a **primary App ID**.

   ![App ID capabilities — Sign in with Apple enabled](/img/authentication/providers/apple/5-app-id-capability.png)

6. Click **Continue**, then **Register**.

### Create a Service ID (Android and Web only)

Skip this section if you are building for iOS or macOS only.

1. In Certificates, Identifiers & Profiles, click **Identifiers → +**.

2. Select **Services IDs** and click **Continue**.

   ![Register a new identifier — Services IDs selected](/img/authentication/providers/apple/6-service-id-create.png)

3. Enter a description and a unique **Identifier** (e.g. `com.example.service`). This value becomes your `serviceIdentifier`. Click **Continue**, then **Register**.

4. Click on the Service ID you just created. Check **Sign in with Apple** and click **Configure**.

5. In the modal, set:
   - **Primary App ID**: the App ID from the previous section
   - **Domains and Subdomains**: your domain (e.g. `example.com`)
   - **Return URLs**: your server's callback route (e.g. `https://example.com/auth/callback`)

   ![Web Authentication Configuration — Primary App ID, domains, and return URLs](/img/authentication/providers/apple/7-service-id-configure.png)

6. Click **Next**, then **Done**, then **Save**.

:::warning
All return URLs must use **HTTPS**. Apple rejects HTTP redirect URIs. For local development, expose your server over HTTPS using a tunnelling service.
:::

### Create a Sign in with Apple key

1. In Certificates, Identifiers & Profiles, click **Keys → +**.

2. Enter a key name, check **Sign in with Apple**, and click **Configure**. Select your primary App ID and click **Save**.

   ![Configure key — Sign in with Apple checked, primary App ID selected](/img/authentication/providers/apple/8-key-create.png)

3. Click **Continue**, then **Register**.

   ![Register a New Key — review screen](/img/authentication/providers/apple/8-key-register.png)

4. Download the `.p8` key file immediately — **you can only download it once**. Note the **Key ID** shown on this page.

   ![Download Your Key — one-time download warning with Key ID visible](/img/authentication/providers/apple/8-key-download.png)

5. Find your **Team ID** in your [Apple Developer Account](https://developer.apple.com/account) under Membership.

:::note
Each primary App ID can have a maximum of two private keys. If you reach the limit, revoke an existing key before creating a new one. See [Create a Sign in with Apple private key](https://developer.apple.com/help/account/configure-app-capabilities/create-a-sign-in-with-apple-private-key/) for details.
:::

### Store your credentials

Your server's `config/passwords.yaml` already has `development:`, `staging:`, and `production:` sections from the project template. Add the Apple credentials to the `development:` section:

```yaml
development:
  # ... existing keys (database, redis, serviceSecret, etc.) ...
  appleServiceIdentifier: 'com.example.service'
  appleBundleIdentifier: 'com.example.app'
  appleRedirectUri: 'https://example.com/auth/callback'
  appleTeamId: 'ABC123DEF4'
  appleKeyId: 'XYZ789ABC0'
  appleKey: |
    -----BEGIN PRIVATE KEY-----
    MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
    -----END PRIVATE KEY-----
  # Optional: Required only for Web support when using server callback route.
  appleWebRedirectUri: 'https://example.com/auth/apple-complete'
  # Optional: Required only if you want Apple Sign In to work on Android.
  appleAndroidPackageIdentifier: 'com.example.app'
```

For production, add the same keys to the `production:` section of `passwords.yaml`, or set the corresponding `SERVERPOD_PASSWORD_` environment variables on your production server.

:::warning
**Never commit your `.p8` key to version control.** Use environment variables or a secrets manager in production.

**Paste the raw `.p8` key contents** — the full text including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Do not pre-generate a JWT from it. Serverpod generates the client secret JWT internally on every request.

**Carefully maintain correct indentation for YAML block scalars.** The `appleKey` block uses a `|`; any indentation error will silently break the key, resulting in authentication failures without helpful error messages.
:::

## Server-side configuration

Your server's `server.dart` file (e.g., `my_project_server/lib/server.dart`) already contains a `pod.initializeAuthServices()` call from the project template. Add the Apple import and `AppleIdpConfigFromPasswords()` to the existing `identityProviderBuilders` list:

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';
```

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    // ... any existing providers (e.g., EmailIdpConfigFromPasswords) ...
    AppleIdpConfigFromPasswords(),
  ],
);
```

`AppleIdpConfigFromPasswords()` automatically loads the credentials from the Apple keys in `config/passwords.yaml` (or the corresponding `SERVERPOD_PASSWORD_` environment variables).

Apple Sign-In also requires web routes for handling callbacks and revocation notifications. Add this call after `initializeAuthServices`:

```dart
pod.configureAppleIdpRoutes(
  revokedNotificationRoutePath: '/hooks/apple-notification',
  webAuthenticationCallbackRoutePath: '/auth/callback',
);
```

The paths shown above are the defaults. See the [customizations](./customizations) page for details on web routes.

:::tip
If you need more control over how the credentials are loaded, you can use `AppleIdpConfig(...)` with manual `pod.getPassword()` calls instead. See the [customizations](./customizations) page for details.
:::

Then, create a new endpoint file in your server project (e.g., `my_project_server/lib/src/auth/apple_idp_endpoint.dart`) alongside the existing auth endpoints and extend the abstract endpoint to expose it:

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';

class AppleIdpEndpoint extends AppleIdpBaseEndpoint {}
```

Run the following commands from your server project directory (e.g., `my_project_server/`) to generate client code and apply the database migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

:::note
Skipping the migration will cause the server to crash at runtime when the Apple provider tries to read or write user data. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).
:::

### Basic configuration options

- `serviceIdentifier`: Required (Android/Web). The service identifier for the Sign in with Apple project.
- `bundleIdentifier`: Required. The bundle ID of the Apple-native app using Sign in with Apple.
- `redirectUri`: Required (Android/Web). The redirect URL used for 3rd party platforms.
- `teamId`: Required. The team identifier of the parent Apple Developer account.
- `keyId`: Required. The ID of the key associated with the Sign in with Apple service.
- `key`: Required. The raw contents of the private key file received from Apple.

When using Web or Android, you can also configure the following optional parameters:

- `webRedirectUri`: The URL where the browser is redirected after the server receives Apple's callback on Web. Required for Web support when using the server callback route.
- `androidPackageIdentifier`: The Android package identifier for the app. Required for Apple Sign In to work on Android. When configured, the callback route automatically redirects Android clients back to the app using an intent URI.

For more details on configuration options, see the [customizations](./customizations) page.

## Client-side configuration

The `serverpod_auth_idp_flutter` package implements the sign-in logic using [sign_in_with_apple](https://pub.dev/packages/sign_in_with_apple). The documentation for this package should in most cases also apply to the Serverpod integration.

:::note
Sign in with Apple may not work correctly on all Simulator versions. If you run into issues during development, test on a physical device to confirm whether the problem is Simulator-specific.
:::

### iOS and macOS

Enable the Sign in with Apple capability in your Xcode project:

1. Open your project in Xcode
2. Select your target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Sign in with Apple"

![Add capabilities](/img/authentication/providers/apple/1-xcode-add.png)

![Sign in with Apple](/img/authentication/providers/apple/2-xcode-sign-in-with-apple.png)

### Android

Apple Sign In on Android works through a web-based OAuth flow. When the user completes authentication, Apple redirects to your server's callback route, which then redirects back to your app using an Android intent URI with the `signinwithapple` scheme.

The redirect URI and `appleAndroidPackageIdentifier` were already configured in the [Store your credentials](#store-your-credentials) and [Service ID](#create-a-service-id-android-and-web-only) steps. The only remaining step is to register the `signinwithapple` URI scheme in your `AndroidManifest.xml`:

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

:::warning
This intent filter is required. Without it, the OAuth callback never returns to your app and sign-in silently hangs.
:::

### Web

Apple Sign In on Web uses a server callback first, then redirects the browser to your web app. The redirect URI and `appleWebRedirectUri` were already configured in the [Store your credentials](#store-your-credentials) and [Service ID](#create-a-service-id-android-and-web-only) steps, so no additional setup is needed.

:::warning
All redirect URIs must use **HTTPS**. Apple rejects HTTP URLs, including `localhost`. For local development, expose your server over HTTPS using a tunnelling service, like ngrok or Cloudflare Tunnel.
:::

## Present the authentication UI

### Initialize the Apple sign-in service

In your Flutter app's `main.dart` file (e.g., `my_project_flutter/lib/main.dart`), the template already sets up the `Client` and calls `client.auth.initialize()`. Add `client.auth.initializeAppleSignIn()` right after it:

```dart
client.auth.initialize();
client.auth.initializeAppleSignIn();
```

### Add the sign-in widget

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Apple identity provider will be automatically detected and displayed in the sign-in widget.

You can also use the `AppleSignInWidget` directly in your widget tree to include the Apple authentication flow in your own custom UI:

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

AppleSignInWidget(
  client: client,
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $error')),
    );
  },
)
```

This renders an Apple sign-in button like this:

![Apple sign-in button](/img/authentication/providers/apple/3-button.png)

The widget automatically handles:

- Apple Sign-In flow for iOS, macOS, Android, and Web.
- Token management.
- Underlying Apple Sign-In package error handling.

For details on how to customize the Apple Sign-In UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).

:::warning
**Apple sends the user's email address and full name only on the first sign-in.** On all subsequent sign-ins, neither is included in the response. If your server does not persist them during that first authentication, they cannot be retrieved later.

Use the `sub` claim (the stable user identifier) to identify users. Do not use the email address, as it may change when a user updates their "Hide My Email" settings. For more information, see [Authenticating users with Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/authenticating-users-with-sign-in-with-apple).
:::

:::warning
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::
