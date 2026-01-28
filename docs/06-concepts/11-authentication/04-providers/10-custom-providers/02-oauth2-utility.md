# OAuth2 Utility

The Serverpod Auth module provides generic OAuth2 utilities that simplify implementing custom identity providers. These utilities handle the complex OAuth2 authorization code flow with PKCE (Proof Key for Code Exchange), allowing you to integrate any OAuth2-compliant provider without dealing with low-level protocol details.

The OAuth2 utility consists of client-side and server-side components that work together to securely authenticate users:

- **Client-side (`OAuth2PkceUtil`)**: Manages the authorization flow in your Flutter app, handling browser redirects and PKCE challenge generation.
- **Server-side (`OAuth2PkceUtil`)**: Exchanges authorization codes for access tokens on your backend.

:::info
The [GitHub](../github/setup) provider is built using these utilities, serving as a reference implementation for developers creating custom providers.
:::

## Understanding OAuth2 with PKCE

OAuth2 with PKCE is an authorization protocol that allows users to grant your application access to their data without sharing passwords. The PKCE extension adds an additional security layer, particularly important for mobile and public clients.

### The OAuth2 Flow

Here's how the complete flow works:

1. **Generate Code Verifier**: Client generates a random cryptographic string (code verifier).
2. **Generate Code Challenge**: Client creates a SHA-256 hash of the verifier (code challenge).
3. **Authorization Request**: Client redirects user to provider with the code challenge.
4. **User Authorizes**: User logs in and grants permissions.
5. **Receive Code**: Provider redirects back with an authorization code.
6. **Token Exchange**: Client sends code + verifier to your backend.
7. **Backend Exchange**: Backend exchanges code + verifier for access token.
8. **Access Protected Resources**: Use access token to fetch user information.

PKCE ensures that even if an attacker intercepts the authorization code, they cannot exchange it for an access token without the original code verifier.

## Client-Side Implementation

### Configuration

Start by creating a client-side configuration that defines your provider's OAuth2 endpoints and parameters:

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final config = OAuth2PkceProviderClientConfig(
  // Your provider's authorization endpoint
  authorizationEndpoint: Uri.https('oauth.provider.com', '/oauth/authorize'),

  // OAuth client ID from your provider
  clientId: 'your-client-id',

  // Callback URI registered with your provider
  redirectUri: 'myapp://auth-callback',

  // URL scheme for the callback
  callbackUrlScheme: 'myapp',

  // Default permission scopes to request
  defaultScopes: ['profile', 'email'],

  // Additional query parameters for authorization request
  additionalAuthParams: {
    'response_mode': 'query',
  },

  // Separator for joining scopes (default: ' ')
  scopeSeparator: ' ',

  // Enable state parameter for CSRF protection (default: true)
  enableState: true,

  // Enable PKCE for OAuth2 flow (default: true)
  enablePKCE: true,
);
```

### Initiating Authorization

Use the `OAuth2PkceUtil` to start the authorization flow:

```dart
final oauth2Util = OAuth2PkceUtil(config: config);

try {
  final result = await oauth2Util.authorize(
    // Optional: Override default scopes
    scopes: ['profile', 'email', 'read:posts'],

    // Optional: Add dynamic parameters to the authorization request
    authCodeParams: {
      'prompt': 'consent',
    },
  );

  // The authorization code to exchange for an access token
  final code = result.code;

  // The PKCE code verifier (required for token exchange)
  final codeVerifier = result.codeVerifier;

  // Send both to your backend
  await client.myProviderIdp.authenticate(
    code: code,
    codeVerifier: codeVerifier,
    redirectUri: config.redirectUri,
  );
} on OAuth2PkceUserCancelledException catch (e) {
  // User cancelled the authorization flow
  print('User cancelled: ${e.message}');
} on OAuth2PkceStateMismatchException catch (e) {
  // Possible CSRF attack detected
  print('Security error: ${e.message}');
} on OAuth2PkceMissingAuthorizationCodeException catch (e) {
  // No authorization code in callback
  print('Authorization failed: ${e.message}');
} on OAuth2PkceProviderErrorException catch (e) {
  // Provider returned an error
  print('Provider error: ${e.message}');
} on OAuth2PkceUnknownException catch (e) {
  // Unexpected error
  print('Unknown error: ${e.message}');
}
```

### Exception Handling

The client-side utility throws specific exceptions to help you handle different error scenarios:

| Exception | Description | Typical Cause |
| ----------- | ------------- | --------------- |
| `OAuth2PkceUserCancelledException` | User cancelled authorization | User closed browser/denied access |
| `OAuth2PkceStateMismatchException` | State validation failed | Possible CSRF attack or browser issue |
| `OAuth2PkceMissingAuthorizationCodeException` | No authorization code received | Provider didn't return expected code |
| `OAuth2PkceProviderErrorException` | Provider returned error response | Invalid credentials, rate limiting |
| `OAuth2PkceUnknownException` | Unexpected error occurred | Network issues, unknown problems |

### Platform-Specific Configuration

The OAuth2 utility uses the [flutter_web_auth_2](https://pub.dev/packages/flutter_web_auth_2) package under the hood, which requires platform-specific setup.

#### iOS and macOS

No special configuration needed for standard OAuth flows. For Universal Links (iOS) or Associated Domains (macOS), follow the [flutter_web_auth_2 documentation](https://pub.dev/packages/flutter_web_auth_2).

#### Android

Add the callback activity to your `AndroidManifest.xml`:

```xml
<manifest>
  <application>

    <activity
      android:name="com.linusu.flutter_web_auth_2.CallbackActivity"
      android:exported="true">
      <intent-filter android:label="flutter_web_auth_2">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- Replace with your actual callback URL scheme -->
        <data android:scheme="myapp" />
      </intent-filter>
    </activity>

  </application>
</manifest>
```

#### Web

Create an HTML callback page in your `./web` folder (e.g., `auth.html`):

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

:::note
You only need a single callback file (e.g. `auth.html`) in your `./web` folder.
This file is shared across all IDPs that use the OAuth2 utility, as long as your redirect URIs point to it.
:::

Configure your redirect URI to point to this file: `https://yourdomain.com/auth.html`

## Server-Side Implementation

### Configuration

Create a server-side configuration for token exchange:

```dart
import 'package:serverpod_auth_idp_server/core.dart';

final config = OAuth2PkceServerConfig(
  // Token endpoint URL for exchanging authorization codes
  tokenEndpointUrl: Uri.https('oauth.provider.com', '/oauth/token'),

  // OAuth client ID (must match client-side)
  clientId: pod.getPassword('myProviderClientId')!,

  // OAuth client secret (keep secure!)
  clientSecret: pod.getPassword('myProviderClientSecret')!,

  // Function to extract access token from provider response
  parseAccessToken: (data) {
    // Your parse logic here
  },

  // Optional: Where to send credentials (default: header)
  credentialsLocation: OAuth2CredentialsLocation.header,

  // Optional: Custom parameter names for credentials
  clientIdKey: 'client_id',
  clientSecretKey: 'client_secret',

  // Optional: Custom headers for token requests
  tokenRequestHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  },

  // Optional: Additional parameters for token exchange
  tokenRequestParams: {
    'grant_type': 'authorization_code',
  },
);
```

### Credentials Location

OAuth2 providers accept client credentials in two ways:

#### Header Mode (Recommended)

Sends credentials in the `Authorization` header using HTTP Basic authentication:

```dart
credentialsLocation: OAuth2CredentialsLocation.header,
```

This is the preferred method per RFC 6749 and is more secure as credentials aren't logged in request bodies.

#### Body Mode

Sends credentials as form parameters in the request body:

```dart
credentialsLocation: OAuth2CredentialsLocation.body,
```

Use this if your provider doesn't support header-based authentication.

### Exchanging Tokens

Use the `OAuth2PkceUtil` on your endpoint to exchange the authorization code:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';

class MyProviderIdpEndpoint extends Endpoint {
  final oauth2Util = OAuth2PkceUtil(config: config);

  Future<AuthSuccess> authenticate(
    Session session, {
    required String code,
    required String codeVerifier,
    required String redirectUri,
  }) async {
    try {
      // Exchange authorization code for access token
      final accessToken = await oauth2Util.exchangeCodeForToken(
        code: code,
        codeVerifier: codeVerifier,
        redirectUri: redirectUri,
      );

      // Use access token to fetch user information
      final userInfo = await _fetchUserInfo(accessToken);

      // Authenticate or create user in your system
      return await _authenticateUser(session, userInfo);
    } on OAuth2InvalidResponseException catch (e) {
      session.log('Invalid token response: ${e.message}');
      throw Exception('Authentication failed');
    } on OAuth2MissingAccessTokenException catch (e) {
      session.log('Missing access token: ${e.message}');
      throw Exception('Authentication failed');
    } on OAuth2NetworkErrorException catch (e) {
      session.log('Network error: ${e.message}');
      throw Exception('Network error during authentication');
    }
  }
}
```

### Exception Handling

The server-side utility throws these exceptions:

| Exception | Description | Typical Cause |
| ----------- | ------------- | --------------- |
| `OAuth2InvalidResponseException` | Invalid response from provider | HTTP errors, malformed JSON |
| `OAuth2MissingAccessTokenException` | Access token not in response | Provider didn't return token |
| `OAuth2NetworkErrorException` | Network failure | Timeout, connection issues |
| `OAuth2UnknownException` | Unexpected error | Unknown problems |

## Complete Example: Custom Provider

Here's a complete example implementing a custom OAuth2 provider:

### Step 1: Client Configuration

```dart
// lib/src/my_provider_config.dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

class MyProviderConfig {
  static OAuth2PkceProviderClientConfig get clientConfig {
    return OAuth2PkceProviderClientConfig(
      authorizationEndpoint: Uri.https(
        'oauth.myprovider.com',
        '/oauth/authorize',
      ),
      clientId: const String.fromEnvironment('MY_PROVIDER_CLIENT_ID'),
      redirectUri: 'myapp://auth-callback',
      callbackUrlScheme: 'myapp',
      defaultScopes: ['profile', 'email'],
    );
  }
}
```

### Step 2: Client Service

```dart
// lib/src/my_provider_service.dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'my_provider_config.dart';

class MyProviderService {
  static final instance = MyProviderService._();
  MyProviderService._();

  late final OAuth2PkceUtil _oauth2Util;

  void initialize() {
    _oauth2Util = OAuth2PkceUtil(
      config: MyProviderConfig.clientConfig,
    );
  }

  Future<OAuth2PkceResult> signIn() async {
    return await _oauth2Util.authorize();
  }
}
```

### Step 3: Server Configuration

```dart
// lib/src/server/my_provider_idp_config.dart
import 'package:serverpod_auth_idp_server/core.dart';

class MyProviderIdpConfig {
  final String clientId;
  final String clientSecret;

  const MyProviderIdpConfig({
    required this.clientId,
    required this.clientSecret,
  });

  OAuth2PkceServerConfig get oauth2Config {
    return OAuth2PkceServerConfig(
      tokenEndpointUrl: Uri.https(
        'oauth.myprovider.com',
        '/oauth/token',
      ),
      clientId: clientId,
      clientSecret: clientSecret,
      parseAccessToken: _parseAccessToken,
    );
  }

  static String _parseAccessToken(Map<String, dynamic> response) {
    final error = response['error'] as String?;
    if (error != null) {
      throw OAuth2InvalidResponseException('Provider error: $error');
    }

    final token = response['access_token'] as String?;
    if (token == null) {
      throw const OAuth2MissingAccessTokenException(
        'No access token',
      );
    }

    return token;
  }
}
```

### Step 4: Server Endpoint

```dart
// lib/src/endpoints/my_provider_endpoint.dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MyProviderEndpoint extends Endpoint {
  Future<AuthSuccess> authenticate(
    Session session, {
    required String code,
    required String codeVerifier,
    required String redirectUri,
  }) async {
     final config = MyProviderIdpConfig(
      clientId: session.serverpod.getPassword('myProviderClientId')!,
      clientSecret: session.serverpod.getPassword('myProviderClientSecret')!,
    );

    _oauth2Util = OAuth2PkceUtil(config: config.oauth2Config);

    // Exchange code for access token
    final accessToken = await _oauth2Util.exchangeCodeForToken(
      code: code,
      codeVerifier: codeVerifier,
      redirectUri: redirectUri,
    );

    // Fetch user information from provider
    final userInfo = await _fetchUserInfo(session, accessToken);

    // Find or create user in your system
    final authUserId = await _findOrCreateUser(session, userInfo);

    // Issue authentication token
    return await AuthServices.instance.issueToken(
      session,
      authUserId: authUserId,
    );
  }

  Future<Map<String, dynamic>> _fetchUserInfo(
    Session session,
    String accessToken,
  ) async {
    final response = await http.get(
      Uri.https('api.myprovider.com', '/user'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );

    if (response.statusCode != 200) {
      session.log('Failed to fetch user info: ${response.statusCode}');
      throw Exception('Failed to fetch user information');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<UuidValue> _findOrCreateUser(
    Session session,
    Map<String, dynamic> userInfo,
  ) async {
    // Implementation depends on your data model
    // This is a simplified example
    final providerId = userInfo['id'].toString();

    // Check if user exists
    var account = await MyProviderAccount.db.findFirstRow(
      session,
      where: (t) => t.providerId.equals(providerId),
    );

    if (account != null) {
      return account.authUserId;
    }

    // Create new user
    final authUser = await AuthUsers().create(session);

    account = await MyProviderAccount.db.insertRow(
      session,
      MyProviderAccount(
        providerId: providerId,
        email: userInfo['email'] as String?,
        authUserId: authUser.id,
      ),
    );

    return account.authUserId;
  }
}
```

### Step 5: Initialize in Flutter

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';
import 'src/my_provider_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final client = Client('http://localhost:8080/')
    ..connectivityMonitor = FlutterConnectivityMonitor()
    ..authSessionManager = FlutterAuthSessionManager();

  await client.auth.initialize();

  // Initialize your custom provider
  MyProviderService.instance.initialize();

  runApp(MyApp(client: client));
}
```

### Step 6: Use in UI

```dart
// lib/src/sign_in_button.dart
import 'package:flutter/material.dart';
import 'package:your_client/your_client.dart';
import 'my_provider_service.dart';

class MyProviderSignInButton extends StatefulWidget {
  final Client client;
  final VoidCallback? onAuthenticated;

  const MyProviderSignInButton({
    required this.client,
    this.onAuthenticated,
    super.key,
  });

  @override
  State<MyProviderSignInButton> createState() =>
      _MyProviderSignInButtonState();
}

class _MyProviderSignInButtonState
    extends State<MyProviderSignInButton> {
  bool _isLoading = false;

  Future<void> _signIn() async {
    setState(() => _isLoading = true);

    try {
      final result = await MyProviderService.instance.signIn();

      await widget.client.myProvider.authenticate(
        code: result.code,
        codeVerifier: result.codeVerifier!,
        redirectUri: 'myapp://auth-callback',
      );

      widget.onAuthenticated?.call();
    } catch (e) {
      // Handle error
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sign in failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: _isLoading ? null : _signIn,
      child: _isLoading
          ? const CircularProgressIndicator()
          : const Text('Sign in with My Provider'),
    );
  }
}
```

## Best Practices

### Security Considerations

1. **Always Use PKCE**: Keep `enablePKCE: true` in your client configuration. PKCE protects against authorization code interception attacks.
2. **Validate State Parameter**: Keep `enableState: true` to prevent CSRF attacks. The state parameter ensures the authorization response matches your request.
3. **Secure Client Secret**: Never expose your client secret in client-side code. Store it securely in `passwords.yaml` or environment variables on the server.
4. **Use HTTPS**: Always use HTTPS URLs for production endpoints. Only use HTTP for local development.
5. **Validate Redirect URIs**: Ensure redirect URIs in your code exactly match those registered with your OAuth provider.

### Error Handling

1. **Catch Specific Exceptions**: Handle each exception type appropriately rather than using generic catch-all handlers.
2. **Log Securely**: Log errors for debugging but never log sensitive data like tokens or secrets.
3. **User-Friendly Messages**: Show clear, actionable error messages to users without exposing technical details.

## Additional Resources

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [flutter_web_auth_2 Documentation](https://pub.dev/packages/flutter_web_auth_2)
- [GitHub Provider Implementation](https://github.com/serverpod/serverpod/pull/4546/) - Reference implementation using OAuth2 utilities
