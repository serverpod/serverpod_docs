# Setup

Sign in with GitHub uses OAuth2 credentials from a **GitHub App** registered on GitHub.

## Prerequisites

Before following this guide, make sure you have:

- A GitHub account with access to [Developer Settings](https://github.com/settings/apps).
- A running Serverpod project (server, client, and Flutter app packages from `serverpod create`).
- The Serverpod auth module installed and configured per the [authentication setup](../../setup). If your project was generated with an older Serverpod version, follow that guide first to add `serverpod_auth_idp_server` and `serverpod_auth_idp_flutter` and to configure `pod.initializeAuthServices()` before continuing.

:::note
If you specifically need an **OAuth App** instead of a GitHub App, the setup flow below is the same except OAuth Apps allow only a single Callback URL (GitHub Apps allow up to 10). See GitHub's [Differences between GitHub Apps and OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps).
:::

## Get your GitHub credentials

### Register a new GitHub App

1. Go to [Register new GitHub App](https://github.com/settings/apps/new).

2. Fill in the basics:

   - **GitHub App name** (required, up to 34 characters, unique across GitHub).
   - **Homepage URL**
   - **Description** (optional, shown to users during install).

![GitHub App basics](/img/authentication/providers/github/1-app-basics.png)

### Configure the callback URL

The callback URL is where GitHub redirects the user after they authorize your app. For Serverpod sign-in, this must match the redirect URI you pass to `initializeGitHubSignIn` in your Flutter app, and the registered URL in the web callback page setup.

1. In the **Callback URL** field, enter the redirect URI for your app. GitHub Apps accept up to 10 entries, one per line. Add every platform you target:

   | Platform | Example value |
   | --- | --- |
   | iOS and Android | `com.example.yourapp://auth` (custom scheme registered in `AndroidManifest.xml` and `Info.plist`) |
   | Web (Serverpod-hosted Flutter) | `https://my-awesome-project.serverpod.space/auth/callback` |
   | Web (Flutter dev server) | `http://localhost:49660/auth.html` |

   The web entries depend on how your Flutter web app is served. See [Web](#web) below for the two flows (Serverpod-hosted using a built-in callback route, or separately-hosted using a static `auth.html` file).

   :::tip
   For the mobile scheme, use a value unique to your app (reverse-DNS of your bundle ID is a good convention, for example `com.example.yourapp://auth`). Generic schemes like `myapp://auth` work but can collide with other apps installed on the device.
   :::

   ![Callback URL field](/img/authentication/providers/github/2-callback-url.png)

2. Leave **Expire user authorization tokens** enabled (GitHub's default). Token expiration is recommended for sign-in flows so leaked tokens have a short useful lifetime. Serverpod handles the refresh flow automatically; you do not need to write any refresh logic.

3. Leave **Request user authorization (OAuth) during installation** unchecked unless you need the installation to immediately trigger an OAuth sign-in.

### Disable webhooks

Webhooks let your GitHub App receive events like pushes, pull requests, and issue activity. They are unrelated to sign-in and add complexity if you do not need them, so turn the section off for now. You can re-enable webhooks later without affecting the auth flow.

Under **Webhook**, uncheck **Active** to disable the whole section.

![Disable webhook](/img/authentication/providers/github/3-webhook-disable.png)

### Set permissions

GitHub Apps use fine-grained **permissions** instead of OAuth **scopes**. For sign-in you only need access to the user's profile.

1. Under **Account permissions**, set **Email addresses** to **Read-only**. This lets your app read the user's primary verified email.

2. Leave all other permissions at **No access** unless your app needs them for non-auth reasons.

   ![Account permissions](/img/authentication/providers/github/4-permissions.png)

:::note
GitHub users can keep their email private. Even with the **Email addresses** permission, the `email` field on the account may be `null`. See [Custom account validation](./customizations#custom-account-validation) for how to handle this without blocking sign-in.
:::

### Choose the installation scope

1. Under **Where can this GitHub App be installed?**, choose:

   - **Only on this account** for development or internal-only apps.
   - **Any account** for production apps that anyone can sign in to.

### Create the app and copy credentials

1. Click **Create GitHub App**. GitHub takes you to the new app's settings page.

2. Copy the **Client ID** shown on that page.

3. Click **Generate a new client secret**, then copy the secret immediately. GitHub only shows the secret once.

   ![Client ID and Generate secret button](/img/authentication/providers/github/5-credentials.png)

:::warning
**Keep the Client Secret confidential.** Do not commit it to version control. Use `config/passwords.yaml` (excluded from git) or environment variables.
:::

## Server-side configuration

### Store your credentials

Your server's `config/passwords.yaml` already has `development:`, `staging:`, and `production:` sections from the project template. Add `githubClientId` and `githubClientSecret` to the `development:` section using the values you just copied:

```yaml
development:
  # ... existing keys (database, redis, serviceSecret, etc.) ...
  githubClientId: 'your-github-client-id'
  githubClientSecret: 'your-github-client-secret'
```

For production, add the same two keys to the `production:` section, or set the `SERVERPOD_PASSWORD_githubClientId` and `SERVERPOD_PASSWORD_githubClientSecret` environment variables on your production server. See [Publishing to production](#publishing-to-production) below for the full prod walkthrough.

:::warning
**Never commit `config/passwords.yaml` to version control.** It contains your client secret. Use environment variables or a secrets manager in production.
:::

### Add the GitHub identity provider

Your server's `server.dart` file (e.g., `my_project_server/lib/server.dart`) should already contain a `pod.initializeAuthServices()` call if your project was created with the Serverpod project template (`serverpod create`). If it's not there, see [Setup](../../setup) first to configure the auth module and JWT settings.

Add the GitHub import and `GitHubIdpConfigFromPasswords()` to the existing `identityProviderBuilders` list:

```dart
import 'package:serverpod_auth_idp_server/providers/github.dart';
```

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    // ... any existing providers (e.g., EmailIdpConfigFromPasswords) ...
    GitHubIdpConfigFromPasswords(),
  ],
);
```

`GitHubIdpConfigFromPasswords()` automatically loads the client ID and secret from the `githubClientId` and `githubClientSecret` keys in `config/passwords.yaml` (or the matching `SERVERPOD_PASSWORD_*` environment variables).

:::tip
If you need more control over how the credentials are loaded, use `GitHubIdpConfig(clientId: ..., clientSecret: ...)` instead. See [Customizations](./customizations) for details.
:::

### Create the endpoint

Create a new endpoint file in your server project (e.g., `my_project_server/lib/src/auth/github_idp_endpoint.dart`) alongside the existing auth endpoints. Extending the base class registers the sign-in methods with your server so the Flutter client can call them to complete the authentication flow:

```dart
import 'package:serverpod_auth_idp_server/providers/github.dart';

class GitHubIdpEndpoint extends GitHubIdpBaseEndpoint {}
```

### Generate code and apply migrations

Run the following commands from your server project directory (e.g., `my_project_server/`) to generate client code and apply the database migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

:::warning
Skipping the migration will cause the server to crash at runtime when the GitHub provider tries to read or write user data. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).
:::

## Client-side configuration

The GitHub identity provider uses [`flutter_web_auth_2`](https://pub.dev/packages/flutter_web_auth_2) under the hood to drive the OAuth2 redirect on every platform. The configuration differs slightly between platforms because each one has a different way of receiving the callback URL.

### iOS and macOS

No special configuration is needed for a standard custom-scheme callback URL (e.g., `myapp://auth`). The `flutter_web_auth_2` package handles the redirect using `ASWebAuthenticationSession`.

If you use **Universal Links** instead, your redirect URI must use `https` and you must follow the [flutter_web_auth_2 iOS setup](https://pub.dev/packages/flutter_web_auth_2#ios) to register the associated domain.

### Android

To capture the custom-scheme callback URL, add the following activity to your Flutter project's `android/app/src/main/AndroidManifest.xml`. Replace `your-callback-scheme` with the scheme you registered on your GitHub App (e.g., `myapp` for `myapp://auth`):

```xml
<manifest>
  <application>

    <activity
      android:name="com.linusu.flutter_web_auth_2.CallbackActivity"
      android:exported="true"
      android:taskAffinity="">
      <intent-filter android:label="flutter_web_auth_2">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="your-callback-scheme" />
      </intent-filter>
    </activity>

  </application>
</manifest>
```

:::warning
The scheme in `AndroidManifest.xml` must exactly match the scheme in your GitHub App's **Callback URL** and the `redirectUri` you pass to `initializeGitHubSignIn`. A mismatch causes the OAuth callback to never reach your app.
:::

### Web

On web, GitHub sign-in redirects the browser to a callback page that posts the result back to your Flutter app via `postMessage`. The browser enforces same-origin on `postMessage`, so the callback page must be served from the same host and port as your Flutter web app.

Serverpod can host this callback for you when the Flutter web app is served by the same Serverpod server (the default project template, which copies the Flutter web build into Serverpod's `web/app/` directory via the `flutter_build` script). Use the static `auth.html` fallback only if your Flutter web app is hosted on a different origin (for example, a separate dev server during local development, or a CDN in production).

#### Serverpod-hosted Flutter web

1. In `server.dart`, before `pod.start()`, register the callback route:

   ```dart
   import 'package:serverpod_auth_idp_server/core.dart';

   // ...

   pod.webServer.addRoute(
     FlutterWebAuth2CallbackRoute(host: 'my-awesome-project.serverpod.space'),
     '/auth/callback',
   );
   ```

   Set `host` to the domain that serves your Flutter web app so the route only responds to requests on that origin. The second argument to `addRoute` is the path; use any path you like, as long as it matches the callback URL registered on your GitHub App and the `redirectUri` you pass to `initializeGitHubSignIn`.

   The route is provider-agnostic. Register it once and reuse the same callback URL across every OAuth2 PKCE provider (GitHub, Google, etc.).

2. Register `https://my-awesome-project.serverpod.space/auth/callback` as a **Callback URL** on your GitHub App.

3. Pass the same URL to `initializeGitHubSignIn` via the `redirectUri` argument when you initialize the client (covered in [Present the authentication UI](#present-the-authentication-ui) below).

:::note
`FlutterWebAuth2CallbackRoute` requires `serverpod_auth_idp_server` 3.5.0-beta.8 or later. On earlier versions, use the [Separately-hosted Flutter web](#separately-hosted-flutter-web-or-local-flutter-dev-server) flow instead.
:::

#### Separately-hosted Flutter web (or local Flutter dev server)

If your Flutter web app is served on a different origin from Serverpod, the `postMessage` from the callback page is blocked by the browser. This is the situation during local development when you run `flutter run -d chrome --web-port=49660` and Serverpod's web server is on `localhost:8082`, or in production if you host the Flutter web build on a CDN separate from your Serverpod API server.

In that case, place a static `auth.html` file in your Flutter project's `web/` folder. A single copy is shared across every identity provider that uses an OAuth2 redirect, so create it once.

```html
<!DOCTYPE html>
<title>Authentication complete</title>
<p>Authentication is complete. If this does not happen automatically, please close the window.</p>
<script>
  function postAuthenticationMessage() {
    const message = {
      'flutter-web-auth-2': window.location.href
    };

    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
      window.close();
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, window.location.origin);
    } else {
      localStorage.setItem('flutter-web-auth-2', window.location.href);
      window.close();
    }
  }

  postAuthenticationMessage();
</script>
```

Register the full URL of this file (for example, `http://localhost:49660/auth.html` for the Flutter dev server) as a **Callback URL** on your GitHub App, and pass the same URL to `initializeGitHubSignIn` via `redirectUri`. GitHub Apps accept up to 10 callback URLs, so dev and prod entries can coexist with mobile schemes.

## Present the authentication UI

### Initialize the GitHub sign-in service

Open your Flutter app's `main.dart` (e.g., `my_project_flutter/lib/main.dart`). The Serverpod template already creates the `Client` and calls `client.auth.initialize()` inside `main()`. Add `client.auth.initializeGitHubSignIn(...)` on the line immediately after it.

The GitHub provider requires `clientId` and `redirectUri` on every platform because GitHub does not have native platform-specific clients (unlike Google or Apple):

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final serverUrl = await getServerUrl();

  client = Client(serverUrl)
    ..connectivityMonitor = FlutterConnectivityMonitor()
    ..authSessionManager = FlutterAuthSessionManager();

  await client.auth.initialize();
  await client.auth.initializeGitHubSignIn(
    clientId: 'your-github-client-id',
    redirectUri: Uri.parse('com.example.yourapp://auth'),
  );

  runApp(const MyApp());
}
```

Replace `your-github-client-id` with the **Client ID** from your GitHub App, and `redirectUri` with the matching callback URL you registered: a reverse-DNS custom scheme for mobile, `https://your-domain.com/auth/callback` for Serverpod-hosted web, or the full `auth.html` URL when Flutter web is separately hosted.

:::tip
To keep these values out of `main.dart` and vary them per build, read them from `--dart-define`. See [Configuring client IDs on the app](./customizations#configuring-client-ids-on-the-app) for the pattern.
:::

### Show the GitHub sign-in button

The Serverpod template ships with a `SignInScreen` widget at `lib/screens/sign_in_screen.dart`. It listens to `client.auth.authInfoListenable` and swaps between `SignInWidget` while the user is signed out and the `child` you pass it once they sign in. `SignInWidget` auto-detects which identity provider endpoints are registered on the server, so once `GitHubIdpEndpoint` is exposed and `serverpod generate` has run, the GitHub button appears inside it.

To customize the GitHub button or build a fully custom UI, see [Customizing the UI](./customizing-the-ui).

## Publishing to production

Before going live, complete the following steps:

### 1. Add the production callback URL

Go back to your GitHub App's settings and add your production callback URL to **Callback URL** alongside the development one. Both should remain registered so dev and prod work simultaneously.

- For Serverpod-hosted Flutter web (standard project template), the production callback is `https://my-awesome-project.serverpod.space/auth/callback`. Make sure `pod.webServer.addRoute(FlutterWebAuth2CallbackRoute(host: 'my-awesome-project.serverpod.space'), '/auth/callback')` is called in `server.dart` so the route is registered in production.
- For separately-hosted Flutter web, use the production `auth.html` URL (for example, `https://app.example.com/auth.html`).
- For mobile custom schemes (e.g., `com.example.yourapp://auth`), no change is needed between dev and prod.

### 2. Set production credentials

Production runs out of the `production:` section of `passwords.yaml`, which is separate from the `development:` section you populated during setup. Adding production credentials does not replace your development ones, both stay in place and Serverpod picks the right set based on the run mode.

If you use the same GitHub App for development and production, you can reuse the same `githubClientId` and `githubClientSecret`. For separate environments, [register a second GitHub App](https://github.com/settings/apps/new) first and use its values.

#### Self-hosted

Add `githubClientId` and `githubClientSecret` to the `production:` section of `passwords.yaml`:

```yaml
production:
  # ... existing keys ...
  githubClientId: 'your-github-client-id'
  githubClientSecret: 'your-github-client-secret'
```

Alternatively, set the `SERVERPOD_PASSWORD_githubClientId` and `SERVERPOD_PASSWORD_githubClientSecret` [environment variables](../../../07-configuration.md#2-via-environment-variables) on your production server with the same values.

#### Serverpod Cloud

Use `scloud password set` to upload each value. The Client ID is public, so pass it as a positional argument. The Client Secret is sensitive, so read it from a file with `--from-file` to keep it out of your shell history:

```bash
scloud password set githubClientId your-github-client-id
scloud password set githubClientSecret --from-file path/to/github-client-secret.txt
```

Run these from your linked server project directory, or pass `--project <project-id>` on each call (the flag is required unless the project is linked). See the [Serverpod Cloud passwords guide](https://docs.serverpod.dev/cloud/guides/passwords) for project linking and other options.

### 3. Verify the redirect URI in the Flutter build

The production build of your Flutter app must initialize `GitHubSignInService` with the production `redirectUri`. The cleanest pattern is to read it from `--dart-define` so a single `main.dart` works in dev and prod. See [Configuring client IDs on the app](./customizations#configuring-client-ids-on-the-app).

:::tip
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::
