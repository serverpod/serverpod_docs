# Configuration

This page covers configuration options for the anonymous identity provider beyond the basic setup.

## Using a token for app attestation

The anonymous `login` endpoint accepts an optional **token** that is forwarded to your `onBeforeAnonymousAccountCreated` callback. This lets you tie anonymous sign-in to an app attestation or app-check provider (e.g. [Firebase App Check](https://firebase.google.com/docs/app-check)) so only requests from your real app can create anonymous accounts.

:::warning
Using the anonymous provider without a token for app attestation is not recommended due to the risk of abuse. Make sure to configure an attestation before releasing your app to the public.
:::

### Configuring the Flutter app

Obtain a token from your app-check provider and pass it to the login call by setting `createAnonymousToken` on `AnonymousSignInWidget` or `AnonymousAuthController`. That callback is invoked when the user taps "Continue without account". The returned token is sent to the server as the `token` argument of the anonymous login endpoint.

```dart
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

AnonymousSignInWidget(
  client: client,
  createAnonymousToken: () async {
    // Get a Firebase App Check token (or similar) to prove the request comes
    // from your app to prevent abuse.
    final appCheckToken = await FirebaseAppCheck.instance.getToken();
    return appCheckToken;
  },
  onAuthenticated: () { /* ... */ },
  onError: (error) { /* ... */ },
)
```

### Configuring the Server

In `onBeforeAnonymousAccountCreated`, receive the optional `token` and verify it with your app-check provider. If verification fails or the token is missing (when you require it), throw an `AnonymousAccountBlockedException` with reason `denied` to block account creation.

```dart
AnonymousIdpConfig(
  onBeforeAnonymousAccountCreated: (
    Session session, {
    String? token,
    required Transaction? transaction,
  }) async {
    if (token == null || token.isEmpty) {
      throw AnonymousAccountBlockedException(
        reason: AnonymousAccountBlockedExceptionReason.denied,
      );
    }
    // Verify the token with your app-check provider (e.g. Firebase App Check).
    // Example: call Firebase's verifyAppCheckToken REST API or your provider's
    // verification endpoint. If invalid, throw AnonymousAccountBlockedException.
    final isValid = await _verifyAppCheckToken(session, token);
    if (!isValid) {
      throw AnonymousAccountBlockedException(
        reason: AnonymousAccountBlockedExceptionReason.denied,
      );
    }
  },
)
```

For Firebase App Check, you can verify the token from a custom backend using the [Firebase App Check REST API](https://firebase.google.com/docs/app-check/custom-resource-backend) (`verifyAppCheckToken`). Other app-check or attestation providers can be integrated the same way: client sends a token, server validates it in the callback and denies creation if invalid.

## Reacting to anonymous account creation

Beside the `onBeforeAnonymousAccountCreated` callback to allow or deny creation, you can also use the `onAfterAnonymousAccountCreated` callback to run logic after a new anonymous account has been created (e.g. analytics or side effects).

```dart
AnonymousIdpConfig(
  onAfterAnonymousAccountCreated: (
    Session session, {
    required UuidValue authUserId,
    required Transaction? transaction,
  }) async {
    // e.g. track creation for analytics or send to your logging service
  },
)
```

## Rate limiting

The anonymous provider includes built-in rate limiting per IP address to prevent abuse. The default is 100 anonymous account creations per hour per IP. You can customize the rate limit in the `AnonymousIdpConfig` using the `perIpAddressRateLimit` parameter:

```dart
AnonymousIdpConfig(
  perIpAddressRateLimit: const RateLimit(
    maxAttempts: 50,
    timeframe: Duration(hours: 1),
  ),
)
```

When the limit is exceeded, the provider throws an `AnonymousAccountBlockedException` with reason `tooManyAttempts`.
