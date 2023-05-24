# Google

To set up Sign in with Google, you will need a Google account for your organization and set up a new project. For the project, you need to set up _Credentials_ and _Oauth consent screen_. You will also need to add the `serverpod_auth_google_flutter` package to your app and do some additional setup depending on each platform.

A comprehensive tutorial covering everything about google sign in is available [here](todo).

:::note
Right now, we only have official support for iOS, Android, and Web for Google Sign In.
:::

:::caution
You need to install the auth module before you continue, see [Setup](../setup)
:::

## Create your credentials

To implement Google Sign In, you need a google cloud project. You can create one in the [Google Cloud Console](https://console.cloud.google.com/).

### Enable Peoples API

To be allowed to access user data and use the authentication method in Serverpod we have to enable the Peoples API in our project.

[Enable it here](https://console.cloud.google.com/apis/library/people.googleapis.com) or find it yourself by, navigating to the _Library_ section under _APIs & Services_. Search for _Google People API_, select it, and click on _Enable_.

### Setup OAuth consent screen

Can be found [here](https://console.cloud.google.com/apis/credentials/consent) or under _APIs & Services_ > _OAuth consent screen_.

1. Fill in all the required information, for production use you need a domain that adds under `Authorized` domains`.

2. Add the scopes `.../auth/userinfo.email` and `.../auth/userinfo.profile`.

3. Add your email to the test users so that you can test your integration in development mode.

![Scopes](/img/authentication/providers/google/1-scopes.png)

## Server-side Configuration

Create the server credentials in the google cloud console. Navigate to _Credentials_ under _APIs & Services_. Click _Create Credentials_ and select _OAuth client ID_. Configure the OAuth client as a _**Web application**_. If you have a domain add it to the `Authorized JavaScript origins` and `Authorized redirect URIs`. For development purposes we can add `http://localhost:8082` to both fields, this is the address to the web server.

Download the JSON file for your web application OAuth client. This file contains both the client id and the client secret. Rename the file to `google_client_secret.json` and place it in your server's `config` directory.

:::warning

The `google_client_secret.json` contains a private key and should not be version controlled.

:::

![Google credentials](/img/6-google-credentials.jpg)

## Client-side Configuration

For our client-side configurations, we have to first create client-side credentials and include the credentials files in our projects. The Android and iOS integrations use the [google_sign_in](https://pub.dev/packages/google_sign_in) package under the hood, any documentation there should also apply to this setup.

:::info
Rather than using the credentails file for iOS and Android, you can pass the `clientId` and the `serverClientId` to the `signInWithGoogle` method or the `SignInWithGoogleButton` widget. The `serverClientId` is the client ID from the server credentials.
:::

### iOS

Create the client credentials. Navigate to _Credentials_ under _APIs & Services_. Click _Create Credentials_ and select _OAuth client ID_. Configure the OAuth client as Application type _**iOS**_.

Fill in all the required information, and create the credentials. Then download the `plist` file rename it to `GoogleService-Info.plist` and put it inside your ios project folder. Then drag and drop it into your XCode project to include the file in your build.

Open the `GoogleService-Info.plist` in your editor and add the SERVER_CLIENT_ID if it does not exists:

```xml
<dict>
  ...
  <key>SERVER_CLIENT_ID</key>
  <string>your_server_client_id</string>
</dict>
```

Replace `your_server_client_id` with the client id from the JSON file you put inside the config folder in the server.

#### Add the URL Scheme

To allow us to navigate back to the app after the user has signed in we have to add the URL Scheme, the scheme is the reversed client ID of your iOS app. You can find it inside the `GoogleService-Info.plist` file.

Open the `info.plist` file in your editor and add the following to register the URL Scheme.

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
        <string>your_reversed_client_id</string>
      </array>
    </dict>
  </array>
</dict>
```

Replace `your_reversed_client_id` with your reversed client ID.

:::info

If you have any social logins in your app you also need to integrate "Sign in with Apple" to publish your app to the app store. ([Read more](https://developer.apple.com/sign-in-with-apple/get-started/))

:::

### Android

Create the client credentials. Navigate to _Credentials_ under _APIs & Services_. Click _Create Credentials_ and select _OAuth client ID_. Configure the OAuth client as Application type _**Android**_.

Fill in all required information, you can get the debug SHA-1 hash by running `./gradlew signingReport` in your Android project directory. Create the credentials and download the JSON file.

Put the file inside the `android/app/` directory and rename it to `google-services.json`.

:::info
For a production app you need to get the SHA-1 key from your production keystore! This can be done by running this command: ([Read more](https://support.google.com/cloud/answer/6158849#installedapplications&android&zippy=%2Cnative-applications%2Candroid))

```bash
keytool -list -v -keystore /path/to/keystore
```

:::

### Web

There is no need to create any client credentials for the web we will simply pass the `serverClientId` to the sign-in button.
However, we have to modify the server credentials inside the google cloud console. 

Navigate to _Credentials_ under _APIs & Services_ and select the server credentials. Under `Authorized JavaScript origins` and `Authorized redirect URIs` add the domain for your flutter app, for development this is `http://localhost:port` where the port is the port you are using.

We also need to set up the actual redirect URI where the user will navigate too after the sign-in. You can choose any path you want but it has to be the same in the credentials, your server configuration, and Flutter configuration.

We pick the path `/googlesignin`
For development inside `Authorized redirect URIs` add `http://localhost:8082/googlesignin`, in production use `https://example.com/googlesignin`.
Click Save!

![Google credentials](/img/authentication/providers/google/2-credentials.png)

:::info
Force flutter to run on a specific port by running
```bash
flutter run -d chrome --web-port=49660
```

:::


#### Serve the redirect page

Open `server.dart` in your server project, and register the Google Sign In route.

```dart
import 'package:serverpod_auth_server/module.dart' as auth


void run(List<String> args) async {
  ...
  pod.webServer.addRoute(auth.RouteGoogleSignIn(), '/googlesignin');
  ...
}
```

This page is needed for the web app to receive the authentication code given by Google.

### Flutter implementation

![Scopes](/img/authentication/providers/google/3-button.png)

Add the `SignInWithGoogleButton` to your widget.

```dart
import 'package:serverpod_auth_google_flutter/serverpod_auth_google_flutter.dart';


SignInWithGoogleButton(
  caller: client.modules.auth,
  serverClientId: _googleServerClientId, // needs to be supplied for the web integration
  redirectUri: Uri.parse('http://localhost:8082/googlesignin'),
)
```

As an alternative to adding the JSON files in your client projects, you can supply the client and server ID on iOS and Android.

```dart
import 'package:serverpod_auth_google_flutter/serverpod_auth_google_flutter.dart';


SignInWithGoogleButton(
  caller: client.modules.auth,
  clientId: _googleClientId, //Client ID of the client (null on web)
  serverClientId: _googleServerClientId, //Client ID from the server (required on web)
  redirectUri: Uri.parse('http://localhost:8082/googlesignin'),
)
```

## Calling Google APIs

The default setup allows access to basic user information, such as email, profile image, and name. You may require additional access scopes, such as accessing a user's calendar, contacts, or files. To do this, you will need to:

- Add the required scopes to the OAuth consent screen.
- Request access to the scopes when signing in. Do this by setting the `additionalScopes` parameter of the `signInWithGoogle` method or the `SignInWithGoogleButton` widget.

A full list of available scopes can be found [here](https://developers.google.com/identity/protocols/oauth2/scopes).

On the server side, you can now access these Google APIs. If a user has signed in with Google, use the `GoogleAuth.authClientForUser` method from the `serverpod_auth_server` package to request an `AutoRefreshingAuthClient`. The `AutoRefreshingAuthClient` can be used to access Google's APIs on the user's behalf.

For instance, to access the Youtube APIs, add the scope to your `SignInWithGoogleButton` in your app:

```dart
SignInWithGoogleButton(
  ...
  additionalScopes: const ['https://www.googleapis.com/auth/youtube'],
)
```

On the server, you can utilize the [googleapis](https://pub.dev/packages/googleapis) package to access the Youtube API by first creating a client, then calling the API.

```dart
import 'package:serverpod_auth_server/module.dart';
import 'package:googleapis/youtube/v3.dart';


final googleClient = await GoogleAuth.authClientForUser(session, userId);

if (googleClient != null) {
  var youTubeApi = YouTubeApi(googleClient);

  var favorites = await youTubeApi.playlistItems.list(
    ['snippet'],
    playlistId: 'LL', // Liked List
  );

} else {
  // The user hasn't signed in with Google.
}
```

:::info

Adding additional scopes may require approval by Google. On the OAuth consent screen, you can see which of your scopes are considered sensitive.

:::
