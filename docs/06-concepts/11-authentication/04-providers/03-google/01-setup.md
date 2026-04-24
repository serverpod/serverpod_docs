# Setup

Sign in with Google requires a Google Cloud project linked to your organization's Google account. You also need platform-specific OAuth credentials depending on which platforms you target.

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Get your credentials

All platforms require a Web application OAuth client (used by the server). iOS and Android additionally require their own platform-specific OAuth clients.

| Platform | Web OAuth client (server) | iOS OAuth client | Android OAuth client |
| --- | --- | --- | --- |
| iOS | Required | Required | Not needed |
| Android | Required | Not needed | Required |
| Web | Required | Not needed | Not needed |

### Create a Google Cloud project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).

2. Create a new project (or select an existing one).

### Enable People API

The People API is required for Serverpod to access basic user profile data during sign-in.

1. Navigate to the [People API page](https://console.cloud.google.com/apis/library/people.googleapis.com) in your project.

2. Click **Enable**.

![Enable People API](/img/authentication/providers/google/6-people-api.png)

### Configure Google Auth Platform

1. Navigate to the [Google Auth Platform overview](https://console.cloud.google.com/auth/overview) and click **Get started** if you haven't enabled it yet.

   ![Google Auth Platform overview](/img/authentication/providers/google/4-auth-platform-overview.png)

2. **Data access**: Navigate to the [Data Access](https://console.cloud.google.com/auth/scopes) page and add the required scopes: `.../auth/userinfo.email` and `.../auth/userinfo.profile`.

   ![Scopes configuration](/img/authentication/providers/google/1-scopes.png)

   :::tip
   If you need access to additional Google APIs (e.g., Calendar, Drive), you can add more scopes here. See [Accessing Google APIs](./configuration#accessing-google-apis) for details on requesting additional scopes and using them with the `getExtraGoogleInfoCallback` on the server.
   :::

3. **Audience**: Navigate to the [Audience](https://console.cloud.google.com/auth/audience) page and add your email as a test user so you can test the integration in development mode.

   ![Audience and test users](/img/authentication/providers/google/7-audience.png)

:::tip
For production apps, configure additional branding options on the [Branding](https://console.cloud.google.com/auth/branding) page. See the [Google Auth Platform documentation](https://developers.google.com/identity/protocols/oauth2) for more details.
:::

### Create the server OAuth client (Web application)

1. In the Google Auth Platform, navigate to **Clients** and click **Create Client**.

2. Select **Web application** as the application type.

3. Add `http://localhost:8082` to both **Authorized JavaScript origins** and **Authorized redirect URIs** for development. In production, use your server's domain.

   ![Clients configuration](/img/authentication/providers/google/5-clients.png)

4. Click **Create**.

5. Download the JSON file for this client. It contains both the `client_id` and `client_secret` that the server needs.

### Store your credentials

Paste the contents of the downloaded JSON file into the `googleClientSecret` key in `config/passwords.yaml`:

```yaml
development:
  googleClientSecret: |
    {
      "web": {
        "client_id": "your-client-id.apps.googleusercontent.com",
        "project_id": "your-project-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "your-client-secret",
        "redirect_uris": ["http://localhost:8082"]
      }
    }
```

:::warning
**Never commit your `google_client_secret.json` to version control.** It contains your OAuth client secret. Use environment variables or a secrets manager in production.

**Carefully maintain correct indentation for YAML block scalars.** The `googleClientSecret` block uses a `|`; any indentation error will silently break the JSON, resulting in authentication failures.
:::

## Server-side configuration

After storing your credentials, configure the Google identity provider in your main `server.dart` file by setting the `GoogleIdpConfig` as an `identityProviderBuilders` entry in your `pod.initializeAuthServices()` configuration:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/google.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
    ],
    identityProviderBuilders: [
      GoogleIdpConfig(
        clientSecret: GoogleClientSecret.fromJsonString(
          pod.getPassword('googleClientSecret')!,
        ),
      ),
    ],
  );

  await pod.start();
}
```

:::tip
You can use the `GoogleIdpConfigFromPasswords` constructor in replacement of the `GoogleIdpConfig` above to automatically load the client secret from the `config/passwords.yaml` file or environment variables. It will expect the `googleClientSecret` key on the file or the `SERVERPOD_PASSWORD_googleClientSecret` environment variable.
:::

Then, extend the abstract endpoint to expose it on the server:

```dart
import 'package:serverpod_auth_idp_server/providers/google.dart';

class GoogleIdpEndpoint extends GoogleIdpBaseEndpoint {}
```

Run `serverpod generate` to generate the client code, then create and apply a database migration to initialize the provider's tables:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

:::note
Skipping the migration will cause the server to crash at runtime when the Google provider tries to read or write user data. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).
:::

### Basic configuration options

- `clientSecret`: Required. Google OAuth client secret loaded from JSON. See the [configuration section](./configuration) for details on different ways to load the client secret.

For more details on configuration options, such as customizing account validation, accessing Google APIs, and more, see the [configuration section](./configuration).

## Client-side configuration

The Android and iOS integrations use the [google_sign_in](https://pub.dev/packages/google_sign_in) package under the hood, so any documentation there should also apply to this setup.

### iOS

1. In the Google Auth Platform, navigate to **Clients** and click **Create Client**.

2. Select **iOS** as the application type.

3. Fill in your app's **Bundle ID** and any other required information.

4. Click **Create** and download the `.plist` file.

   ![Create iOS OAuth client](/img/authentication/providers/google/8-ios-client-create.png)

5. Open your `ios/Runner/Info.plist` file and add the following keys:

   ```xml
   <dict>
     ...
     <key>GIDClientID</key>
     <string>your_ios_client_id</string>
     <key>GIDServerClientID</key>
     <string>your_server_client_id</string>
   </dict>
   ```

   Replace `your_ios_client_id` with the `CLIENT_ID` value from the downloaded plist file, and `your_server_client_id` with the client ID from the server credentials JSON file.

#### Add the URL scheme

To allow navigation back to the app after sign-in, add the URL scheme to your `Info.plist`. The scheme is the reversed client ID of your iOS app (found as `REVERSED_CLIENT_ID` in the downloaded plist file).

```xml
<dict>
  ...
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeRole</key>
      <string>Editor</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>com.googleusercontent.apps.your_client_id</string>
      </array>
    </dict>
  </array>
</dict>
```

Replace the URL scheme with your actual reversed client ID.

:::warning
Without the URL scheme, the OAuth callback never returns to your app and sign-in silently hangs.
:::

:::info
If you have any social logins in your app, you also need to integrate Sign in with Apple to publish your app to the App Store. ([Read more](https://developer.apple.com/sign-in-with-apple/get-started/)).
:::

### Android

1. In the Google Auth Platform, navigate to **Clients** and click **Create Client**.

2. Select **Android** as the application type.

3. Fill in your app's **Package name** and **SHA-1 certificate fingerprint**. You can get the debug SHA-1 hash by running:

   ```bash
   ./gradlew signingReport
   ```

4. Click **Create** and download the JSON file.

   ![Create Android OAuth client](/img/authentication/providers/google/9-android-client-create.png)

5. Place the file inside the `android/app/` directory and rename it to `google-services.json`.

:::info
If your `google-services.json` does not include a web OAuth client entry, you may need to provide client IDs programmatically as described on the [configuration page](./configuration#configuring-client-ids-on-the-app).
:::

:::warning
For a production app, you need the SHA-1 key from your production keystore, not the debug one. Get it by running:

```bash
keytool -list -v -keystore /path/to/keystore
```

See the [Google Cloud documentation](https://support.google.com/cloud/answer/6158849#installedapplications&android&zippy=%2Cnative-applications%2Candroid) for more details.
:::

:::tip
If you encounter issues with Google Sign-In on Android, check the [official troubleshooting guide](https://pub.dev/packages/google_sign_in_android#troubleshooting) for common solutions, or see the [troubleshooting page](./troubleshooting).
:::

### Web

Web uses the same OAuth client as the server, so you don't need to create a new one. However, you need to update the server client's authorized origins to include your Flutter app's domain.

1. In the Google Auth Platform, navigate to **Clients** and select the server credentials (the one configured as **Web application**).

2. Under **Authorized JavaScript origins**, add the domain for your Flutter app. For development, this is `http://localhost:<port>`.

3. Under **Authorized redirect URIs**, add `http://localhost:8082` for development. In production, use your server's domain (e.g., `https://example.com`).

   ![Web credentials configuration](/img/authentication/providers/google/2-credentials.png)

   :::info
   Force Flutter to run on a specific port by running:

   ```bash
   flutter run -d chrome --web-hostname localhost --web-port=49660
   ```

   :::

4. In your `web/index.html` file, add the following to the `<head>` section:

   ```html
   <head>
     ...
     <meta name="google-signin-client_id" content="your_server_client_id">
   </head>
   ```

   Replace `your_server_client_id` with the client ID from your server OAuth client JSON file.

## Present the authentication UI

### Initializing the `GoogleSignInService`

To use the GoogleSignInService, you need to initialize it in your main function. The initialization is done from the `initializeGoogleSignIn()` extension method on the `FlutterAuthSessionManager`.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'package:your_client/your_client.dart';

final client = Client('http://localhost:8080/')
  ..authSessionManager = FlutterAuthSessionManager();

void main() {
  client.auth.initialize();
  client.auth.initializeGoogleSignIn();
}
```

### Using GoogleSignInWidget

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Google identity provider will be automatically detected and displayed in the sign-in widget.

You can also use the `GoogleSignInWidget` to include the Google authentication flow in your own custom UI.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

GoogleSignInWidget(
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

This renders a Google sign-in button like this:

![Google sign-in button](/img/authentication/providers/google/3-button.png)

The widget automatically handles:

- Google Sign-In flow for iOS, Android, and Web.
- Lightweight sign-in (One Tap, FedCM) support.
- Token management.
- Underlying Google Sign-In package error handling.

For details on how to customize the Google Sign-In UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).

:::warning
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::
