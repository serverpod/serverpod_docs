# Setup

## Prerequisites

Before you start, make sure you have:

- A Serverpod project with the new auth module installed. New projects created with `serverpod create` (Serverpod 3.4 and later) include it by default. If you are upgrading an older project, follow the [auth module setup guide](../../setup) first.
- An active subscription to the [Apple Developer Program](https://developer.apple.com/programs/). Sign in with Apple requires this even for local development.
- Xcode installed if you target iOS or macOS.

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
All return URLs must use **HTTPS**. Apple rejects HTTP URLs, including `localhost`. For local development, expose your server over HTTPS using a tunnelling service, like ngrok or Cloudflare Tunnel.
:::

:::note
If you plan to support web sign-in, also register the value you will use for `appleWebRedirectUri` (e.g. `https://example.com/auth/apple-complete`) under **Return URLs**. Without it, the web flow will fail when Apple validates the redirect.
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
  # Web only (server callback route).
  appleWebRedirectUri: 'https://example.com/auth/apple-complete'
  # Android only.
  appleAndroidPackageIdentifier: 'com.example.app'
```

:::tip
Paste the raw `.p8` file contents as-is. Do not pre-generate a JWT. Serverpod handles that internally. If sign-in fails, see the [troubleshooting guide](./troubleshooting).
:::

When you are ready to ship, see [Going to production](#going-to-production) for the production credential setup.

## Server-side configuration

### Add the Apple identity provider

:::caution
If your project doesn't have the auth module installed yet (for example, you're upgrading an older project), follow the [auth module Setup](../../setup) guide first before continuing.
:::

In your server's `server.dart`, import the Apple provider and add it to the existing `identityProviderBuilders` list on `pod.initializeAuthServices()`:

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';

// ...

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

`AppleIdpConfigFromPasswords()` reads the eight `apple*` keys from `config/passwords.yaml` (or the corresponding `SERVERPOD_PASSWORD_` environment variables), so you do not have to wire up each credential manually.

:::tip
If you need more control over how the credentials are loaded, you can use `AppleIdpConfig(...)` with manual `pod.getPassword()` calls instead. See the [customizations](./customizations) page for details.
:::

### Configure web routes

Sign in with Apple requires web routes for handling callbacks and revocation notifications. Add this call before `pod.start()`:

```dart
pod.configureAppleIdpRoutes(
  revokedNotificationRoutePath: '/hooks/apple-notification',
  webAuthenticationCallbackRoutePath: '/auth/callback',
);
```

The `webAuthenticationCallbackRoutePath` must match the **Return URL** you registered on your Service ID. The `revokedNotificationRoutePath` is called by Apple when a user revokes access from their Apple ID settings.

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

The Flutter app created with `serverpod create` already has `serverpod_auth_idp_flutter` in `pubspec.yaml`. If your app doesn't, add it:

```bash
flutter pub add serverpod_auth_idp_flutter
```

It uses [sign_in_with_apple](https://pub.dev/packages/sign_in_with_apple) under the hood for platform-specific sign-in flows.

:::note
Sign in with Apple may not work correctly on all Simulator versions. If you run into issues during development, test on a physical device to confirm whether the problem is Simulator-specific.
:::

### iOS and macOS

Enable the Sign in with Apple capability in your Xcode project:

1. Open your project in Xcode.
2. Select your target.
3. Go to **Signing & Capabilities**.
4. Click **+ Capability**.
5. Add **Sign in with Apple**.

![Add capabilities](/img/authentication/providers/apple/1-xcode-add.png)

![Sign in with Apple](/img/authentication/providers/apple/2-xcode-sign-in-with-apple.png)

### Android

Sign in with Apple on Android works through a web-based OAuth flow. When the user completes authentication, Apple redirects to your server's callback route, which then redirects back to your app using an Android intent URI with the `signinwithapple` scheme.

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

Sign in with Apple on Web requires the Apple JS SDK. Add the following script to your Flutter app's `web/index.html` inside the `<head>` tag:

```html
<script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" crossorigin="anonymous"></script>
```

The redirect URI and `appleWebRedirectUri` were already configured in the [Store your credentials](#store-your-credentials) and [Service ID](#create-a-service-id-android-and-web-only) steps.

## Present the authentication UI

### Initialize the Sign in with Apple service

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

You can also pass the values directly as parameters instead. See the [customizations page](./customizations#configuring-sign-in-with-apple-on-the-app) for details.

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

This renders a Sign in with Apple button like this:

![Sign in with Apple button](/img/authentication/providers/apple/3-button.png)

The widget automatically handles:

- Sign in with Apple flow for iOS, macOS, Android, and Web.
- Token management.
- Underlying `sign_in_with_apple` package error handling.

For details on how to customize the Sign in with Apple UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).

:::warning
Apple sends the user's email and name only on the **first sign-in**. If your server does not persist them during that first authentication, they cannot be retrieved later.
:::

## Going to production

### Update the Apple Developer Portal

Add your production domain and callback URL to the Service ID. The development tunnel URL and the production URL can stay registered at the same time.

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), open your Service ID.
2. Under **Sign in with Apple**, click **Configure**.
3. Add your production domain to **Domains and Subdomains** (e.g. `example.com`).
4. Add your production callback to **Return URLs** (e.g. `https://example.com/auth/callback`).
5. Click **Next**, **Done**, then **Save**.

### Set production credentials

Production runs out of the `production:` section of `passwords.yaml`, which is separate from the `development:` section you populated during setup. Adding production credentials does not replace your development ones, both stay in place and Serverpod picks the right set based on the run mode.

Most credentials, like the Team ID, Key ID, and `.p8` private key, can be reused from development. The values that typically differ are the URLs (`appleRedirectUri` and `appleWebRedirectUri`), which should point at your production domain rather than your development tunnel. If you use a different App ID or Service ID for production, register them in the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list) first and use those identifiers below.

Pick the path that matches your deployment:

#### Self-hosted

Add the `apple*` keys to the `production:` section of `passwords.yaml` with production values, or set them as environment variables on the production server using the `SERVERPOD_PASSWORD_` prefix (e.g. `SERVERPOD_PASSWORD_appleServiceIdentifier`, `SERVERPOD_PASSWORD_appleKey`).

#### Serverpod Cloud

Use `scloud password set` for each credential. The `appleKey` value spans multiple lines, so pass it via `--from-file`:

```bash
scloud password set appleServiceIdentifier "com.example.service"
scloud password set appleBundleIdentifier "com.example.app"
scloud password set appleRedirectUri "https://example.com/auth/callback"
scloud password set appleTeamId "ABC123DEF4"
scloud password set appleKeyId "XYZ789ABC0"
scloud password set appleKey --from-file ./AuthKey_XYZ789ABC0.p8
scloud password set appleWebRedirectUri "https://example.com/auth/apple-complete"
scloud password set appleAndroidPackageIdentifier "com.example.app"
```

Run these from your linked server project directory, or pass `--project <project-id>` on each call. See the [Serverpod Cloud passwords guide](https://docs.serverpod.dev/cloud/guides/passwords) for project linking and other options.

### Update client builds

For Web and Android release builds, pass the production Service ID and redirect URI via `--dart-define`:

```bash
flutter build web \
  --dart-define="APPLE_SERVICE_IDENTIFIER=com.example.service" \
  --dart-define="APPLE_REDIRECT_URI=https://example.com/auth/callback"
```

:::tip
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::
