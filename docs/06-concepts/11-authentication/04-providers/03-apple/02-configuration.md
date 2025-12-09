# Configuration

This page covers configuration options for the Apple identity provider beyond the basic setup.

<!-- ## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `AppleIdpConfig` in-code documentation. -->

## Web Routes Configuration

Apple Sign-In requires web routes for handling callbacks and notifications. These routes must be configured both on Apple's side and in your Serverpod server.

The `revokedNotificationRoutePath` is the path that Apple will call when a user revokes their authorization. The `webAuthenticationCallbackRoutePath` is the path that Apple will call when a user completes the sign-in process.

These routes are configured in the `pod.configureAppleIdpRoutes()` method:
```dart
pod.configureAppleIdpRoutes(
  revokedNotificationRoutePath: '/hooks/apple-notification',
  webAuthenticationCallbackRoutePath: '/auth/callback',
);
```
