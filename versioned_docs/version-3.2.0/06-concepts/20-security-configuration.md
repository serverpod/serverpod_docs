# Security Configuration

:::info

In a **production environment**, TLS termination is **normally handled by a load balancer** or **reverse proxy** (e.g., Nginx, AWS ALB, or Cloudflare).  
However, Serverpod also supports setting up **TLS/SSL directly on the server**, allowing you to provide your own certificates if needed.

:::

Serverpod supports **TLS/SSL security configurations** through the **Dart configuration object**.  
To enable SSL/TLS, you must pass a **`SecurityContextConfig`** to the `Serverpod` constructor.

## Server Security Configuration

To enable SSL/TLS in Serverpod, configure the `SecurityContextConfig` and pass it to the `Serverpod` instance.

### Dart Configuration Example

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

## Flutter app Security Configuration

When connecting to a **Serverpod server over HTTPS**, the Flutter app must be configured to trust the server's certificate.

### Dart Configuration Example

To enable SSL/TLS when using the Serverpod client, pass a **`SecurityContext`** to the `Client` constructor.

```dart
final securityContext = SecurityContext()
  ..setTrustedCertificates('path/to/server_cert.pem');


final client = Client(
  'https://yourserver.com',
  securityContext: securityContext,
  ...
);
```
