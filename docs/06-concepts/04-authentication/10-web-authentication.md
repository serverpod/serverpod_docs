---
sidebar_label: Web setup
description: Keep web sign-in tokens in httpOnly cookies so JavaScript can never read them, with server configuration, client setup, CORS implications, and local development notes.
---

# Set up authentication on the web

Browsers have no secure storage: anything kept in `localStorage`, `sessionStorage`, or IndexedDB is readable by any JavaScript running on the page, so a single XSS vulnerability can steal a signed-in user's token and replay it from anywhere. Serverpod's cookie mode keeps web tokens in `httpOnly` cookies instead, which scripts cannot read. Cookie mode is opt-in and recommended for any app with signed-in users on the web.

Native and desktop apps are unaffected: they keep their tokens in secure OS storage (such as the Keychain) and need no changes.

## Before you start

- A Serverpod project with the [authentication module](./setup) enabled.
- Your app served over `https` in production. Auth cookies are marked `Secure` by default; relax this only for `http://localhost` during development.

## Configure the server

Enable cookie auth by adding an `authCookie` section to your server configuration (`config/development.yaml`, `config/production.yaml`, and so on), together with the list of origins your web app is served from:

```yaml
authCookie:
  # secure: false # Uncomment only for http://localhost development.
allowedOrigins:
  - https://app.example.com
```

`allowedOrigins` is required when `authCookie` is set: it backs the CSRF origin checks and credentialed CORS, which cannot use a wildcard origin. List every browser origin that calls your server. With cookie auth enabled, browsers on origins that are not in the list lose cross-origin access, including to public endpoints.

All `authCookie` fields are optional:

| Field         | Default                  | Purpose                                                        |
| ------------- | ------------------------ | -------------------------------------------------------------- |
| `name`        | `serverpod_auth`         | Name of the auth cookie.                                       |
| `refreshName` | `<name>_refresh`         | Name of the JWT refresh cookie.                                |
| `domain`      | host-only                | Set to `example.com` to share the cookie across subdomains.    |
| `path`        | `/`                      | Cookie path; also the base path behind a reverse proxy.        |
| `secure`      | `true`                   | Set to `false` only for `http://localhost` development.        |
| `sameSite`    | `lax`                    | `lax`, `strict`, or `none` (`none` requires `secure`).         |

Each field can also be set through environment variables (`SERVERPOD_AUTH_COOKIE_NAME`, `SERVERPOD_AUTH_COOKIE_REFRESH_NAME`, `SERVERPOD_AUTH_COOKIE_DOMAIN`, `SERVERPOD_AUTH_COOKIE_PATH`, `SERVERPOD_AUTH_COOKIE_SECURE`, `SERVERPOD_AUTH_COOKIE_SAME_SITE`, and `SERVERPOD_ALLOWED_ORIGINS`), which override the YAML values.

## Configure the client

Turn on cookie transport when the app runs on the web, immediately after constructing the client and before making any calls:

```dart
import 'package:flutter/foundation.dart';

client = Client(serverUrl)
  ..cookieAuth = kIsWeb
  ..connectivityMonitor = FlutterConnectivityMonitor()
  ..authSessionManager = FlutterAuthSessionManager();
```

Everything else is unchanged: sign-in flows, the `client.auth` session manager, and endpoint calls work as on other platforms. Setting `cookieAuth` to `true` on a non-web platform throws, since those transports have no browser cookie jar.

## How it works

- With **server-side sessions**, the session token is delivered as an `httpOnly` cookie and never appears in the response body.
- With **JWT**, the access token is kept in memory only, and the refresh token is delivered as an `httpOnly` cookie scoped to the refresh endpoint's path. On page load, the session is restored by refreshing from the cookie. Multiple tabs coordinate their refreshes through the browser's Web Locks API, so a shared refresh token is only rotated by one tab at a time.
- **Signing out** clears the cookies and revokes the session on the server.
- **Method streams** authenticate from the cookie at the WebSocket handshake. When the signed-in user changes (sign-in or sign-out), open method streams are closed gracefully — subscriptions receive `onDone` without an error — and new streams connect with the current identity. This applies on every platform, not only the web.
- **Switching users requires a sign-out first.** Signing in as a different user from an already-authenticated session is rejected with a `SignInWhileAuthenticatedException` on all platforms.

## Cross-site request protection

Cookie auth is protected against CSRF in layers: cookies default to `SameSite=Lax`, the server validates the request `Origin` against `allowedOrigins`, and the cookie only authenticates requests carrying a marker header set by the client, which a cross-site form cannot add without a CORS preflight. Nothing needs configuring beyond `allowedOrigins`. Set `sameSite: none` only if your app is embedded cross-site, and keep `secure: true` with it.

## Cross-subdomain cookies

To share the signed-in session between `app.example.com` and other subdomains, set `authCookie.domain` to the registrable domain:

```yaml
authCookie:
  domain: example.com
```

By default the cookie is host-only.

## Local development

- On `http://localhost`, set `authCookie.secure: false` so the browser accepts the cookies.
- On a plain-`http` LAN address (testing from another device), browsers disable the Web Locks API outside secure contexts, so cross-tab refresh coordination is off. The client logs a warning, and refreshing in several tabs at the same moment can occasionally sign the user out. This is an artifact of the insecure test origin; production `https` deployments are unaffected.

## Related

- [Setup](./setup): install and configure the authentication module.
- [Token managers](./token-managers/managing-tokens): choose between JWT and server-side sessions.
- [Streaming](../endpoints-and-apis/streaming): how method streams work.
