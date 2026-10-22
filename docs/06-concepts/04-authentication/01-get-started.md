---
sidebar_label: Get started
description: Authentication is built into every new Serverpod project. Turn on the sign-in screen, run your app, and test signing up and signing in.
---

# Get started with authentication

When you create a project with `serverpod create`, email sign-in is already built in. The server is configured, the database is ready, and your app is connected to it. You only need to turn on the sign-in screen and run the app.

This guide walks you through that, then shows how to test signing up and signing in.

![Sign-in with Serverpod](/img/authentication/sign-in-widget-device.png)

## Prerequisites

- A project created with `serverpod create` on Serverpod 4.0 or later. For older projects, see [Setup](./setup) first to add the authentication module manually.
- The Flutter SDK installed, so you can run the app.
- Docker installed and running, if your project uses a Docker Postgres. Projects on the embedded Postgres option don't need Docker.

:::note
If you run on macOS (`flutter run -d macos`), add the Keychain Sharing entitlement before testing sign-in. See [Set up authentication on macOS](./macos-authentication).
:::

## Show the sign-in screen

Your app already includes a sign-in screen. It is turned off by default. Turn it on with two small edits to your app's `main.dart`.

First, import the screen:

```dart
import 'screens/sign_in_screen.dart';
```

Then show it as the home screen. In `MyHomePage.build()`, comment out the existing `body:` line and uncomment the `SignInScreen` block right below it, so it reads:

```dart
// body: const GreetingsScreen(),
body: SignInScreen(
  child: GreetingsScreen(
    onSignOut: () async {
      await client.auth.signOutDevice();
    },
  ),
),
```

That is the only change your app needs.

## Start your project

From the project root, start everything with one command:

```bash
serverpod start
```

This sets up the database and starts the server and your app.

The app opens on the sign-in screen. To create an account:

1. Enter your email and select **Send code**.
2. Look in the server console for the code. While testing, it is logged instead of emailed:

   ```text
   Login code for you@example.com: <123456>
   ```

3. Enter the code, then select **Create account** to finish.

Once you are signed in, the app shows your content with a sign-out button. The next time you sign in with the same email, entering the code takes you straight to your account.

:::note
Projects created before Serverpod 4.1 use password sign-in, so you set a password when you create the account. To switch, see [Switch an existing project to passwordless sign-in](./providers/email/setup#switch-an-existing-project-to-passwordless-sign-in).
:::

## Next steps

- Send verification emails from your own email service instead of the default. See [Use your own email provider](./providers/email/setup#use-your-own-email-provider).
- Customize the sign-in screen. See [UI components](./ui-components).
- Build your own sign-in UI with the email controller. See [Customizing the UI](./providers/email/customizing-the-ui).
- Let users sign in with a password as well as a code. See [Customizing the UI](./providers/email/customizing-the-ui#using-the-emailotpsigninwidget).
- Change password rules, code length, and rate limits. See [Email configuration](./providers/email/configuration).
- Require sign-in on your endpoints. See [The basics](./basics#requiring-authentication-on-endpoints).
- Add more sign-in options, like Google or Apple. See [Identity providers configuration](./setup#identity-providers-configuration).
