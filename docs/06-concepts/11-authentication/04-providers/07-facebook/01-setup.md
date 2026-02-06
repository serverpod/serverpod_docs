# Setup

To set up **Sign in with Facebook**, you must create an App with use case **Authenticate with Facebook Login** on [Facebook for Developers](https://developers.facebook.com/) and configure your Serverpod application accordingly.

:::note
Right now, we have official support for iOS, Android, Web, and macOS for Facebook Sign In.
:::

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Create your Facebook App

1. Go to [Facebook for Developers](https://developers.facebook.com/apps/creation/) and log in with your Facebook account.
2. Click **Create an app** and follow the setup wizard:
   - **App details**: Enter your **App name** and **App contact email**.
   - **Use cases**: Select **"Authenticate and request data from users with Facebook Login"**.
   - **Business**: Optionally select a **Business Portfolio** if available.
   - Complete any additional **Requirements**.
3. Click through to the **Overview** page and go to your app **Dashboard**.

### Configure Facebook Login

After creating your app, click the **Customize** button next to **"Authenticate and request data from users with Facebook Login"** on the **Dashboard** or **Use cases** page. This opens the customization page with the following menu options:

#### 1. Permissions and features

Configure the permissions your application will request:

- `public_profile` - Added by default, allows access to basic profile information
- `email` - Recommended. Allows to read a person's primary email address

#### 2. Settings

Configure the authentication settings:

- In **Allowed Domains for the JavaScript SDK**, add:
  - `https://www.facebook.com` (required to avoid CORS issues)
  - Your own domain if you plan to support web authentication (e.g., `https://yourdomain.com`)

#### 3. Quickstart

Set up your platforms by selecting and configuring:

- **iOS**
- **Android**
- **Web**
- **Other** (for additional platforms like macOS)

Save your changes after completing the configuration.

### Get App Credentials

1. Go to **Settings** > **Basic** in your Facebook App Dashboard to retrieve:
   - **App ID**
   - **App Secret**
2. Go to **Settings** > **Advanced** to retrieve:
   - **Client Token**

:::tip
The **App Secret** is sensitive. Keep it confidential and never commit it to version control. The **Client Token** is required for some platforms (especially mobile and web).
:::

## Server-side Configuration

### Store the Credentials

Add your Facebook credentials to the `config/passwords.yaml` file, or set them as environment variables `SERVERPOD_PASSWORD_facebookAppId` and `SERVERPOD_PASSWORD_facebookAppSecret`.

```yaml
development:
  facebookAppId: 'YOUR_FACEBOOK_APP_ID'
  facebookAppSecret: 'YOUR_FACEBOOK_APP_SECRET'
```

:::warning
Keep your App Secret confidential. Never commit this value to version control. Store it securely using environment variables or secret management.
:::

### Configure the Facebook Identity Provider

In your main `server.dart` file, configure the Facebook identity provider:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/facebook.dart';

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
      FacebookIdpConfig(
        appId: pod.getPassword('facebookAppId')!,
        appSecret: pod.getPassword('facebookAppSecret')!,
      ),
    ],
  );

  await pod.start();
}
```

:::tip
You can use `FacebookIdpConfigFromPasswords()` to automatically load credentials from `config/passwords.yaml` or the `SERVERPOD_PASSWORD_facebookAppId` and `SERVERPOD_PASSWORD_facebookAppSecret` environment variables:

```dart
identityProviderBuilders: [
  FacebookIdpConfigFromPasswords(),
],
```

:::

### Expose the Endpoint

Create an endpoint that extends `FacebookIdpBaseEndpoint` to expose the Facebook authentication API:

```dart
import 'package:serverpod_auth_idp_server/providers/facebook.dart';

class FacebookIdpEndpoint extends FacebookIdpBaseEndpoint {}
```

### Generate and Migrate

Finally, run `serverpod generate` to generate the client code and create a migration to initialize the database for the provider. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

### Basic configuration options

- `appId`: Required. The App ID of your Facebook App.
- `appSecret`: Required. The App Secret of your Facebook App.

For more details on configuration options, see the [configuration section](./configuration).

## Client-side configuration

Add the `serverpod_auth_idp_flutter` package to your Flutter app. The Facebook provider uses [`flutter_facebook_auth`](https://pub.dev/packages/flutter_facebook_auth) to handle the authentication flow. The documentation for this package should in most cases also apply to this setup.

### Android

The minimum Android SDK version required is 21. Update your `android/app/build.gradle` file:

```gradle
defaultConfig {
    ...
    minSdkVersion 21
    ...
}
```

#### Add Facebook SDK Configuration

1. Open or create `/android/app/src/main/res/values/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
    <string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
    <string name="facebook_client_token">YOUR_CLIENT_TOKEN</string>
</resources>
```

Replace `YOUR_FACEBOOK_APP_ID` with your App ID and `YOUR_CLIENT_TOKEN` with your Client Token (found in **Settings** > **Advanced** > **Client Token** in the Facebook App Dashboard).

1. Open `/android/app/src/main/AndroidManifest.xml` and add the following:

**Add internet permission before the `<application>` element:**

```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

**Add meta-data inside the `<application>` element:**

```xml
<application>
    ...
    <meta-data
        android:name="com.facebook.sdk.ApplicationId"
        android:value="@string/facebook_app_id"/>
    <meta-data
        android:name="com.facebook.sdk.ClientToken"
        android:value="@string/facebook_client_token"/>
    ...
</application>
```

#### Configure Package Visibility (Android 11+)

For Android 11 and above, add the following inside the `<manifest>` element:

```xml
<manifest package="com.example.app">
    <queries>
        <provider android:authorities="com.facebook.katana.provider.PlatformProvider" />
    </queries>
    ...
</manifest>
```

#### Configure Android Platform in Facebook

In the Facebook App Dashboard, go to **Use cases** > **Customize** > **Quickstart** and select the **Android** tab. Follow these steps:

**Step 3: Tell Us about Your Android Project**

Fill in your Android app details:

- **Package Name**: Your app's package identifier (found in `android/app/build.gradle` as `applicationId` or in `AndroidManifest.xml` as `package`).
- **Class Name**: Your main activity class name (typically `MainActivity`).

**Step 4: Add Your Development and Release Key Hashes**

Generate and add your key hashes:

**Debug Key Hash (for development):**

macOS/Linux:

```bash
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
```

Windows:

```bash
keytool -exportcert -alias androiddebugkey -keystore "C:\Users\USERNAME\.android\debug.keystore" | "PATH_TO_OPENSSL_LIBRARY\bin\openssl" sha1 -binary | "PATH_TO_OPENSSL_LIBRARY\bin\openssl" base64
```

**Release Key Hash (for production):**

```bash
keytool -exportcert -alias YOUR_RELEASE_KEY_ALIAS -keystore YOUR_RELEASE_KEY_PATH | openssl sha1 -binary | openssl base64
```

Paste the generated key hashes into the Facebook console and save.

:::note
You can skip the remaining steps (1, 2, 5, 6+) as they are not required for Flutter apps or have already been covered in the previous configuration steps.
:::


For more detailed Android setup instructions, refer to the [flutter_facebook_auth Android documentation](https://facebook.meedu.app/docs/7.x.x/android).

### iOS

The minimum iOS deployment target is 12.0. Update your `ios/Podfile`:

```ruby
platform :ios, '12.0'
```

Also set the deployment target to 12.0 in Xcode (**Runner** > **General** > **Deployment Info**).

#### Configure iOS Platform in Facebook

In the Facebook App Dashboard, go to **Use cases** > **Customize** > **Quickstart** and select the **iOS** tab. Follow these steps:

**Step 2: Add your Bundle Identifier**

Enter your iOS app's Bundle Identifier (found in Xcode under **Runner** > **General** > **Identity** or in your `Info.plist`).

- Example: `com.example.testAuth`

**Step 4: Configure Your info.plist**

This step describes the configuration covered in the next section. Additionally, ensure that the **Keychain Sharing** capability is enabled for your target in Xcode (**Runner** > **Signing & Capabilities** > **+ Capability** > **Keychain Sharing**).

:::note
You can skip the remaining steps (1, 3, 5-9) as they are not required for Flutter apps or have already been covered in the configuration steps.
:::

#### Configure Info.plist

Open `ios/Runner/Info.plist` and add the following configuration (replace placeholders with your actual values):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fbYOUR_APP_ID</string>
    </array>
  </dict>
</array>
<key>FacebookAppID</key>
<string>YOUR_APP_ID</string>
<key>FacebookClientToken</key>
<string>YOUR_CLIENT_TOKEN</string>
<key>FacebookDisplayName</key>
<string>YOUR_APP_NAME</string>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
</array>
```

Replace:

- `YOUR_APP_ID` with your Facebook App ID
- `YOUR_CLIENT_TOKEN` with your Client Token
- `YOUR_APP_NAME` with your app's name

:::tip
If you have other providers (like Google) implemented, merge the values for `CFBundleURLTypes` and `LSApplicationQueriesSchemes` instead of creating duplicate keys.
:::

#### iOS App Tracking Transparency (ATT)

On iOS, Facebook may issue **limited access tokens** when App Tracking Transparency (ATT) permission is not granted. These limited tokens cannot be validated by the server or used to retrieve user profile data, which will cause authentication to fail.

To ensure full Facebook authentication functionality on iOS, you should request ATT permissions before initiating Facebook Sign In. You can use the [`app_tracking_transparency`](https://pub.dev/packages/app_tracking_transparency) package to handle this:

```dart
import 'package:app_tracking_transparency/app_tracking_transparency.dart';

// Request tracking authorization before showing Facebook Sign In
final status = await AppTrackingTransparency.requestTrackingAuthorization();
```

:::warning
Without ATT permission granted, Facebook authentication fails on iOS. Consider requesting this permission early in your app's flow or before showing the Facebook Sign In button.
:::

For more detailed iOS setup instructions, refer to the [flutter_facebook_auth iOS documentation](https://facebook.meedu.app/docs/7.x.x/ios).

### Web

For web platforms, you must initialize the FacebookSignInService with your App ID:

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

Future<void> main() async {
  await client.auth.initializeFacebookSignIn(
    appId: 'YOUR_FACEBOOK_APP_ID',
  );
  runApp(MyApp());
}
```

#### Configure Web Platform in Facebook

**1. Add Site URL in Quickstart**

In the Facebook App Dashboard, go to **Use cases** > **Customize** > **Quickstart** and select the **Web** tab:

Enter your website's Site URL (e.g., `https://yourdomain.com`) and save your changes.

:::note
No other Quickstart steps are required for Flutter web apps.
:::

**2. Configure Allowed Domains in Settings (Important)**

Go to **Use cases** > **Customize** > **Settings** and find **Allowed Domains for the JavaScript SDK**. Add all domains where your app will be accessible:

- Add your development domain: `http://localhost:PORT` (e.g., `http://localhost:56635`).
- Add your production domain: `https://yourdomain.com`.

This configuration enables Facebook authentication to work on these domains. Without this, Facebook Sign In will fail due to CORS restrictions.

:::warning
The facebook javascript SDK is only allowed to use with `https` but you can test the plugin in your localhost with an error message in your web console.
:::

For more detailed web setup instructions, refer to the [flutter_facebook_auth web documentation](https://facebook.meedu.app/docs/7.x.x/web).

### macOS

#### Enable Network Capabilities

In `macos/Runner/Info.plist`, add:

```xml
<key>com.apple.security.network.server</key>
<true/>
```

In Xcode, select the **Runner** target, go to **Signing & Capabilities**, and enable **Outgoing Connections**.

#### Enable Keychain Sharing

macOS uses `flutter_secure_storage` to securely store session data. Add the **Keychain Sharing** capability in Xcode (**Runner** > **Signing & Capabilities** > **+ Capability** > **Keychain Sharing**).

#### Initialize the FacebookSignInService

For macOS, you must initialize the FacebookSignInService with your App ID:

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

Future<void> main() async {
  await client.auth.initializeFacebookSignIn(
    appId: 'YOUR_FACEBOOK_APP_ID',
  );
  runApp(MyApp());
}
```

#### Configure macOS Platform in Facebook

**1. Configure Settings**

Go to **Use cases** > **Customize** > **Settings** and configure the following:

- Enable **Login from Devices** under **Client OAuth settings**.
- Enable **Login with the JavaScript SDK** under **Client OAuth settings**.
- In **Allowed Domains for the JavaScript SDK**, add `https://www.facebook.com` to avoid CORS issues.

For more detailed macOS setup instructions, refer to the [flutter_facebook_auth macOS documentation](https://facebook.meedu.app/docs/7.x.x/macos).
