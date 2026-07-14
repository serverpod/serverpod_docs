---
description: Security configuration in Serverpod lets you enable TLS/SSL directly on the server or configure the client to trust a certificate, using SecurityContextConfig.
---

# Security and TLS

Serverpod can terminate TLS/SSL directly on the server and configure the client to trust your certificate.

:::info

In a production environment, TLS termination is normally handled by a load balancer or reverse proxy (e.g., Nginx, AWS ALB, or Cloudflare).
However, Serverpod also supports setting up TLS/SSL directly on the server, allowing you to provide your own certificates if needed.

:::

## Server security configuration

To enable TLS/SSL, pass a `SecurityContextConfig` to the `Serverpod` constructor.

### Dart configuration example

```dart
final securityContext = SecurityContext()
  ..useCertificateChain('path/to/server_cert.pem')
  ..usePrivateKey('path/to/server_key.pem', password: 'password');

Serverpod(
  args,
  Protocol(),
  Endpoints(),
  securityContextConfig: SecurityContextConfig(
    apiServer: securityContext,
    webServer: securityContext,
    insightsServer: securityContext,
  ),
);
```

## Client security configuration

When connecting to a Serverpod server over HTTPS, the client must be configured to trust the server's certificate.

### Dart configuration example

To enable SSL/TLS, pass a `SecurityContext` to the `Client` constructor.

```dart
final securityContext = SecurityContext()
  ..setTrustedCertificates('path/to/server_cert.pem');

final client = Client(
  'https://yourserver.com',
  securityContext: securityContext,
  ...
);
```

#### Using `SecurityContext` with `httpClientOverride`

If you use the [`httpClientOverride` parameter](../endpoints-and-apis/configure-http-calls), provide the security context through the HTTP client you pass in. You cannot set `securityContext` and `httpClientOverride` on the same `Client` instance.

For example, on `dart:io` platforms you can create an `HttpClient` with your trusted certificates and wrap it in an `IOClient`:

```dart
import 'dart:io';

import 'package:http/io_client.dart';

final securityContext = SecurityContext()
  ..setTrustedCertificates('path/to/server_cert.pem');

final client = Client(
  'https://yourserver.com',
  httpClientOverride: IOClient(
    HttpClient(context: securityContext),
  ),
);
```
