# Setup

Sign in with Apple requires a subscription to the [Apple Developer Program](https://developer.apple.com/programs/), even for development and testing.

## Get your credentials

All platforms require an App ID and a Sign in with Apple key. Android and Web additionally require a Service ID.

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

:::tip
Paste the raw `.p8` file contents as-is. Do not pre-generate a JWT -- Serverpod handles that internally. If sign-in fails, see the [troubleshooting guide](./troubleshooting).
:::

## Server-side configuration

### Add the Apple identity provider

Your server's `server.dart` file (e.g., `my_project_server/lib/server.dart`) should already contain a `pod.initializeAuthServices()` call if your project was created with the Serverpod project template (`serverpod create`). If it's not there, see [Setup](../../setup) first to configure the auth module and JWT settings.

Add the Apple import and `AppleIdpConfigFromPasswords()` to the existing `identityProviderBuilders` list:

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

### Configure web routes

Apple Sign-In requires web routes for handling callbacks and revocation notifications. Add this call before `pod.start()`:

```dart
pod.configureAppleIdpRoutes(
  revokedNotificationRoutePath: '/hooks/apple-notification',
  webAuthenticationCallbackRoutePath: '/auth/callback',
);
```

The `webAuthenticationCallbackRoutePath` must match the **Return URL** you registered on your Service ID. The `revokedNotificationRoutePath` is called by Apple when a user revokes access from their Apple ID settings.

:::tip
If you need more control over how the credentials are loaded, you can use `AppleIdpConfig(...)` with manual `pod.getPassword()` calls instead. See the [customizations](./customizations) page for details.
:::

### Create the endpoint

Create a new endpoint file in your server project (e.g., `my_project_server/lib/src/auth/apple_idp_endpoint.dart`). Extending the base class registers the sign-in methods with your server so the Flutter client can call them:

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';

class AppleIdpEndpoint extends AppleIdpBaseEndpoint {}
```

### Generate code and apply migrations

Run the following commands from your server project directory (e.g., `my_project_server/`) to generate client code and apply the database migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

:::note
Skipping the migration will cause the server to crash at runtime when the Apple provider tries to read or write user data. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).
:::

## Client-side configuration

The `serverpod_auth_idp_flutter` package uses [sign_in_with_apple](https://pub.dev/packages/sign_in_with_apple) under the hood for platform-specific sign-in flows.

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

Apple Sign In on Web requires the Apple JS SDK. Add the following script to your Flutter app's `web/index.html` inside the `<head>` tag:

```html
<script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" crossorigin="anonymous"></script>
```

The redirect URI and `appleWebRedirectUri` were already configured in the [Store your credentials](#store-your-credentials) and [Service ID](#create-a-service-id-android-and-web-only) steps.

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

On **Web and Android**, the sign-in service needs your Service ID and redirect URI. Pass them as build-time environment variables using `--dart-define`:

```bash
flutter run \
  -d "<device>" \
  --dart-define="APPLE_SERVICE_IDENTIFIER=com.example.service" \
  --dart-define="APPLE_REDIRECT_URI=https://example.com/auth/callback"
```

Use the same values you configured in the [Service ID](#create-a-service-id-android-and-web-only) and [Store your credentials](#store-your-credentials) steps.

You can also pass the values directly as parameters instead. See the [customizations page](./customizations#configuring-apple-sign-in-on-the-app) for details.

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
Apple sends the user's email and name only on the **first sign-in**. If your server does not persist them during that first authentication, they cannot be retrieved later.
:::

:::tip
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::
