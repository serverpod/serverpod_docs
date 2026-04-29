# Setup

Sign in with Google requires a Google Cloud project. You also need platform-specific OAuth credentials depending on which platforms you target.

## Get your credentials

All platforms require a Web application OAuth client (used by the server). iOS and Android additionally require their own platform-specific OAuth clients.

### Create a Google Cloud project

1. Go to [Create a project](https://console.cloud.google.com/projectcreate).

2. Enter a **Project name** (e.g. `My Serverpod App`) and click **Create**.

2. Create a new project (or select an existing one).

### Enable People API

The People API is required for Serverpod to access basic user profile data during sign-in.

1. Navigate to the [People API page](https://console.cloud.google.com/apis/library/people.googleapis.com) in your project.

2. Click **Enable**.

![Enable People API](/img/authentication/providers/google/6-people-api.png)

### Configure Google Auth Platform

1. Navigate to the [Google Auth Platform overview](https://console.cloud.google.com/auth/overview) and click **Get started** if you haven't enabled it yet.

   ![Google Auth Platform overview](/img/authentication/providers/google/4-auth-platform-overview.png)

2. **Project configuration**: Complete the setup wizard by filling in the required fields across each step (App Information, Audience, Contact Information) and click **Create**.

   ![Project configuration wizard](/img/authentication/providers/google/4b-project-configuration.png)

3. **Branding**: After completing the wizard, navigate to the [Branding](https://console.cloud.google.com/auth/branding) page from the sidebar. Fill in the remaining fields: app logo, app homepage link, privacy policy link, terms of service link, developer contact email, and **authorized domains**. These details appear on the OAuth consent screen shown to users during sign-in.

   Add any domains you will use in production (e.g., `my-awesome-project.serverpod.space`) to **Authorized domains**. Google will reject redirect URIs that use domains not listed here.

   ![Branding configuration](/img/authentication/providers/google/10-branding.png)

4. **Data access**: Navigate to the [Data Access](https://console.cloud.google.com/auth/scopes) page and add the required scopes: `.../auth/userinfo.email` and `.../auth/userinfo.profile`.

   ![Scopes configuration](/img/authentication/providers/google/1-scopes.png)

   :::tip
   If you need access to additional Google APIs (e.g., Calendar, Drive), you can add more scopes here. See [Accessing Google APIs](./customizations#accessing-google-apis) for details on requesting additional scopes and using them with the `getExtraGoogleInfoCallback` on the server.
   :::

5. **Audience**: Navigate to the [Audience](https://console.cloud.google.com/auth/audience) page. While in development, the app is in **Testing** mode, which means only users you explicitly add as test users can sign in (up to 100). Add your email as a test user so you can test the integration.

   ![Audience and test users](/img/authentication/providers/google/7-audience.png)

   :::tip
   Leave the app in **Testing** mode for now. You can [publish it](#publishing-to-production) after verifying that sign-in works end to end.
   :::

### Create the server OAuth client (Web application)

All platforms (iOS, Android, and Web) require a **Web application** OAuth client for the server. This is the only client type that provides a **client secret**, which Serverpod needs to verify sign-in tokens on the server side.

1. In the Google Auth Platform, navigate to **Clients** and click **Create Client**.

2. Select **Web application** as the application type.

3. Add the following URIs:

   - **Authorized JavaScript origins**: The origin that is allowed to make requests to Google's OAuth servers. For Serverpod, this is your **web server** address.
   - **Authorized redirect URIs**: The URL Google redirects the user back to after they sign in. Serverpod handles this callback on the web server as well.

   Serverpod runs three servers locally (see `config/development.yaml`): the API server on port 8080, the Insights server on 8081, and the **web server on port 8082**. The Google OAuth flow uses the web server, so both fields should point to port 8082:

   | Environment | Authorized JavaScript origins | Authorized redirect URIs |
   | --- | --- | --- |
   | Local development | `http://localhost:8082` | `http://localhost:8082` |
   | Production | Your web server's public URL (e.g., `https://my-awesome-project.serverpod.space`) | Your web server's public URL |

   You can find these ports in your server's `config/development.yaml` under `webServer`.

   ![Clients configuration](/img/authentication/providers/google/5-clients.png)

4. Click **Create**.

5. Copy the **Client ID** and **Client secret** shown on screen. You will need both in the next step.

### Store your credentials

Your server's `config/passwords.yaml` already has `development:`, `staging:`, and `production:` sections from the project template. Add the `googleClientSecret` key to the `development:` section using the client ID and client secret you just copied:

```yaml
development:
  # ... existing keys (database, redis, serviceSecret, etc.) ...
  googleClientSecret: |
    {
      "web": {
        "client_id": "your-client-id.apps.googleusercontent.com",
        "client_secret": "your-client-secret",
        "redirect_uris": ["http://localhost:8082"]
      }
    }
```

Replace `your-client-id` and `your-client-secret` with the values from the Google Auth Platform. The `redirect_uris` must match the **Authorized redirect URIs** you configured in the previous step.

For production, add the same `googleClientSecret` entry to the `production:` section of `passwords.yaml` (with your production redirect URI), or set the `SERVERPOD_PASSWORD_googleClientSecret` environment variable on your production server.

:::warning
**Never commit `config/passwords.yaml` to version control.** It contains your OAuth client secret. Use environment variables or a secrets manager in production.
:::

:::note
**Carefully maintain correct indentation for YAML block scalars.** The `googleClientSecret` block uses a `|`; any indentation error will silently break the JSON, resulting in authentication failures.
:::

## Server-side configuration

### Add the Google identity provider

Your server's `server.dart` file (e.g., `my_project_server/lib/server.dart`) should already contain a `pod.initializeAuthServices()` call if your project was created with the Serverpod project template (`serverpod create`). If it's not there, see [Setup](../../setup) first to configure the auth module and JWT settings.

Add the Google import and `GoogleIdpConfigFromPasswords()` to the existing `identityProviderBuilders` list:

```dart
import 'package:serverpod_auth_idp_server/providers/google.dart';
```

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    // ... any existing providers (e.g., EmailIdpConfigFromPasswords) ...
    GoogleIdpConfigFromPasswords(),
  ],
);
```

`GoogleIdpConfigFromPasswords()` automatically loads the client secret from the `googleClientSecret` key in `config/passwords.yaml` (or the `SERVERPOD_PASSWORD_googleClientSecret` environment variable).

:::tip
If you need more control over how the client secret is loaded, you can use `GoogleIdpConfig(clientSecret: GoogleClientSecret.fromJsonString(...))` instead. See the [customizations](./customizations) page for details.
:::

### Create the endpoint

Create a new endpoint file in your server project (e.g., `my_project_server/lib/src/auth/google_idp_endpoint.dart`) alongside the existing auth endpoints. Extending the base class registers the sign-in methods with your server so the Flutter client can call them to complete the authentication flow:

```dart
import 'package:serverpod_auth_idp_server/providers/google.dart';

class GoogleIdpEndpoint extends GoogleIdpBaseEndpoint {}
```

### Generate code and apply migrations

Run the following commands from your server project directory (e.g., `my_project_server/`) to generate client code and apply the database migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

:::note
Skipping the migration will cause the server to crash at runtime when the Google provider tries to read or write user data. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).
:::

## Client-side configuration

The Android and iOS integrations use the [google_sign_in](https://pub.dev/packages/google_sign_in) package under the hood, so any documentation there should also apply to this setup.

### iOS

1. In the Google Auth Platform, navigate to **Clients** and click **Create Client**.

2. Select **iOS** as the application type.

3. Fill in your app's **Bundle ID** and any other required information.

4. Click **Create** and download the `.plist` file.

   ![Create iOS OAuth client](/img/authentication/providers/google/8-ios-client-create.png)

5. Open the `Info.plist` file in your Flutter project (e.g., `my_project_flutter/ios/Runner/Info.plist`) and add the following keys inside the top-level `<dict>`:

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

To allow navigation back to the app after sign-in, add the URL scheme to the same `Info.plist` file. The scheme is the reversed client ID of your iOS app (found as `REVERSED_CLIENT_ID` in the downloaded plist file). Add the following inside the top-level `<dict>`:

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

### Android

1. In the Google Auth Platform, navigate to **Clients** and click **Create Client**.

2. Select **Android** as the application type.

3. Fill in your app's **Package name** and **SHA-1 certificate fingerprint**. You can get the debug SHA-1 hash by running this from your Flutter project's `android/` directory (e.g., `my_project_flutter/android/`):

   ```bash
   ./gradlew signingReport
   ```

4. Click **Create** and download the JSON file.

   ![Create Android OAuth client](/img/authentication/providers/google/9-android-client-create.png)

5. Place the file inside your Flutter project's `android/app/` directory (e.g., `my_project_flutter/android/app/`) and rename it to `google-services.json`.

:::warning
The downloaded `google-services.json` may not include a web OAuth client entry, which is required for Google Sign-In to resolve the server client ID. If sign-in fails, provide the client IDs programmatically as described on the [customizations](./customizations#configuring-client-ids-on-the-app) page.
:::

### Web

Web uses the same server OAuth client you created earlier, so you don't need a separate client. However, for web, the sign-in request originates from the Flutter app running in the browser, not from the Serverpod web server. Google requires this origin to be listed as well.

1. **Choose a fixed port for your Flutter web app.** Google OAuth requires exact origin matches, and Flutter picks a random port on each run by default. To keep things consistent, run Flutter on a fixed port using `--web-port`:

   ```bash
   flutter run -d chrome --web-hostname localhost --web-port=49660
   ```

   - `-d chrome`: Run on the Chrome browser.
   - `--web-hostname localhost`: Bind to localhost.
   - `--web-port=49660`: Use a fixed port (pick any available port). This is the value you will add to **Authorized JavaScript origins** in the next step.

2. **Update the server OAuth client.** Go back to the server OAuth client you created in the [previous section](#create-the-server-oauth-client-web-application) and add your Flutter web app's origin to **Authorized JavaScript origins**:

   - For local development: `http://localhost:49660` (or whichever port you chose)
   - For production: your Flutter web app's domain (e.g., `https://my-awesome-project.serverpod.space`)

   The **Authorized redirect URIs** should already contain your Serverpod web server's address (`http://localhost:8082`) from the earlier setup. You don't need to change it.

   ![Web credentials configuration](/img/authentication/providers/google/2-credentials.png)

3. **Add the client ID to your Flutter project's `web/index.html`** (e.g., `my_project_flutter/web/index.html`). In the `<head>` section, add:

   ```html
   <head>
     ...
     <meta name="google-signin-client_id" content="your_server_client_id">
   </head>
   ```

   Replace `your_server_client_id` with the client ID from your Web application OAuth client.

## Present the authentication UI

### Initialize the Google sign-in service

In your Flutter app's `main.dart` file (e.g., `my_project_flutter/lib/main.dart`), the template already sets up the `Client` and calls `client.auth.initialize()`. Add `client.auth.initializeGoogleSignIn()` right after it:

```dart
client.auth.initialize();
client.auth.initializeGoogleSignIn();
```

### Add the sign-in widget

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Google identity provider will be automatically detected and displayed in the sign-in widget.

You can also use the `GoogleSignInWidget` directly in your widget tree to include the Google authentication flow in your own custom UI:

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

:::tip
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::

## Publishing to production

While the app is in **Testing** mode, only the test users you added on the [Audience](https://console.cloud.google.com/auth/audience) page can sign in. All other users will see an error.

When you are ready to launch, navigate to the **Audience** page and click **Publish App** to allow any Google account to sign in. If your app uses sensitive or restricted scopes, Google may require a verification review before publishing.
