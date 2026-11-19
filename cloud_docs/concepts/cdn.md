---
sidebar_position: 8
title: Content delivery and caching
description: The Serverpod Cloud CDN serves your app's cacheable static content from the edge nearest each user and clears its cache automatically on every deploy.
---

# Content delivery and caching

Serverpod Cloud runs a CDN, a content delivery network, in front of every app's web server. Whatever your app marks as cacheable is served from an edge server near each visitor, whether it is a Flutter web build, a Jaspr site, or plain static files. Visitors get fast loads wherever they are, and your server does less work. Flutter web builds are cached by default. Other content is cached once your app opts in. Every successful deploy clears the CDN's copies, so a new build reaches visitors right away.

## How caching works

Your app's `Cache-Control` header decides, per response, where a file may be cached and for how long. There are three layers:

- **The visitor's browser:** Keeps its own copy of a file for up to the `max-age` you set. No deploy can clear it, so keep this lifetime short.
- **The CDN at the edge:** Stores cacheable files for up to `s-maxage`, or `max-age` when `s-maxage` is not set. Every successful deploy clears it, and the edge then refills as visitors arrive. The first request for a file at each edge location goes to your server, and later requests get the stored copy. There is no manual purge command. To clear the edge on demand, deploy again.
- **Your server:** Serves responses marked `no-cache`, `private`, or `no-store`, responses with no cache header, responses that set a cookie, and all calls from your Flutter app to your endpoints. Every request for these reaches your server. For `no-cache`, the CDN may keep a copy, but it checks with your server before serving it.

What the common header patterns do at each layer:

| `Cache-Control`                                                        | CDN at the edge                                         | Visitor's browser                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `public, max-age=0, s-maxage=86400` (Cloud default for `FlutterRoute`) | Serves it for up to a day, cleared on every deploy      | Stores it, but checks for a newer copy on every load |
| `no-cache, private` (framework default for `FlutterRoute`)             | Never stores it                                         | Stores it, but checks with your server on every load |
| None (`StaticRoute` and `SpaRoute` default)                            | Never stores it                                         | Decides on its own, using browser heuristics         |
| `public, max-age=60, s-maxage=86400` (recommended)                     | Serves it for up to a day, cleared on every deploy      | Uses it for up to a minute                           |
| `no-cache, public, s-maxage=86400`                                     | Stores it, but checks with your server on every request | Stores it, but checks with your server on every load |

When a file hasn't changed, your server answers those checks with a small 304 Not Modified response instead of the file itself, so they cost little. The last pattern keeps content fresh on every request and saves bandwidth, but your server still handles every request, so it does not reduce load the way `max-age` does.

## Configure caching for Flutter web builds

Every Serverpod Cloud project has the environment variable `SERVERPOD_WEB_SERVER_FLUTTER_CACHE_CONTROL` set to `public, max-age=0, s-maxage=86400`. A `FlutterRoute` that doesn't set its own `cacheControlFactory` sends this header. The project template sets up the route this way. As a result:

- The CDN serves your Flutter build for up to a day and clears it on every deploy.
- Browsers check for a newer copy on every load, so visitors get a new build as soon as you deploy.

The `FlutterRoute` always serves its `index.html` fallback with `no-cache, private`, whatever header you set with the variable or in code, so visitors pick up a new build's entry page right away.

Most apps can leave the default as it is. `SERVERPOD_WEB_SERVER_FLUTTER_CACHE_CONTROL` is a regular [environment variable](/cloud/concepts/passwords-secrets-env-vars#manage-environment-variables), so you can change it or remove it. You can also change it in the console, under **Environment variables** in the project's **Env & Passwords** tab.

To change the header, set the variable to another value:

```bash
serverpod cloud variable set SERVERPOD_WEB_SERVER_FLUTTER_CACHE_CONTROL "public, max-age=60, s-maxage=86400"
```

To turn off edge caching for your Flutter build, remove the variable. The route then sends `no-cache, private`:

```bash
serverpod cloud variable unset SERVERPOD_WEB_SERVER_FLUTTER_CACHE_CONTROL
```

Then deploy again. Your server reads the variable when it starts, and the deploy clears the copies the CDN stored under the old header. A `cacheControlFactory` in your code takes precedence over the variable.

## Set your own cache headers

To cache other content, or to set the Flutter header in code, set a `cacheControlFactory` on the route that serves it, whether that's the `SpaRoute` for another framework's single-page app, a `StaticRoute.directory` for plain files, or the `FlutterRoute` for a Flutter web app. The factory returns the `Cache-Control` header for each file the route serves. The CDN reads only the header on each response, so routes you write yourself work the same way, however your code produces the header. The recommended header is `public, max-age=60, s-maxage=86400`, shown here on a `FlutterRoute`:

```dart
pod.webServer.addRoute(
  FlutterRoute(
    Directory('web/app'),
    cacheControlFactory: (_, _) => CacheControlHeader(
      publicCache: true,
      maxAge: 60,
      sMaxAge: 86400,
    ),
  ),
);
```

Each directive plays a part:

- The `public` directive lets both the browser and the CDN store the file.
- The `max-age=60` directive sets the browser lifetime to one minute, short enough that a visitor picks up a new deploy almost immediately.
- The `s-maxage=86400` directive sets the CDN lifetime to one day. The deploy purge keeps the edge fresh, so this longer lifetime is mainly a safety net. If a purge ever fails, your deploy still succeeds, and the cached copies expire on their own within a day.

For a simpler setup, the `StaticRoute.public` and `StaticRoute.publicImmutable` factories return common header shapes without a custom closure. Any of the three routes accepts them, including the `FlutterRoute` above. They do not set a separate CDN lifetime, so the browser and the CDN share one `max-age`:

```dart
cacheControlFactory: StaticRoute.public(maxAge: const Duration(minutes: 1)),
```

To opt in without code, set the project variable `SERVERPOD_WEB_SERVER_SPA_CACHE_CONTROL` for a `SpaRoute`, or `SERVERPOD_WEB_SERVER_STATIC_CACHE_CONTROL` for a `StaticRoute`. They work like the Flutter variable, but Serverpod Cloud doesn't set them for you.

:::warning
Flutter's build uses fixed file names with no content hashes, so a long browser `max-age` can leave a visitor on an old build after you deploy. Keep the browser lifetime short and let the deploy purge handle the edge.
:::

Caching more aggressively takes cache busting, where each asset URL includes a hash of the file's content, so a new build gets new URLs and old cached copies are never requested again. The web server supports this for static files, and hashed assets can use `publicImmutable` with a long lifetime, because a file at a hashed URL never changes. Flutter's build does not produce hashed names, so for a Flutter build that means post-processing the build output yourself, and the short browser lifetime above is the simpler choice. See the framework [Static files](/concepts/web-server/static-files) guide for the full `cacheControlFactory` and cache-busting reference.

## Verify caching is working

To confirm the CDN is serving a file, request it a few times and read the `age` response header. It reports how many seconds the edge has held its copy of the file:

```bash
curl -s -o /dev/null -D - https://my-app.serverpod.space/main.dart.js
```

The `-o /dev/null` discards the body and `-D -` prints the response headers. A cached file answers like this:

```text
cache-control: public, max-age=0, s-maxage=86400
date: Mon, 20 Jul 2026 08:03:47 GMT
age: 26
```

How to read the responses:

- **No `age` on the first request:** The edge had no copy yet and fetched the file from your server.
- **An `age` that goes up with each request while `date` stays the same:** The edge is serving its stored copy, and those requests never reach your server.
- **No `age` at all:** The response does not opt in to caching (for example, under the `SpaRoute` or `StaticRoute` default), or the request was a HEAD request. The CDN does not cache HEAD requests, so use GET, not `curl -I`.
- **An `age` that resets shortly after a deploy:** The purge cleared the edge, and the new build is being cached.

## Cost and limits

- **No separate charge:** The CDN is part of Serverpod Cloud. Serving from the edge takes static traffic off your server, leaving it more capacity for your endpoint calls.
- **Nothing to turn on:** It is active for every project. Your cache headers are the only switch.
- **Isolated per app:** Cached files are tied to your app's hostnames, so the CDN never serves another app's content to your visitors, even when two apps serve a file at the same path.
- **No usage limits:** Cached traffic is not capped.
- **Every hostname covered:** The CDN serves any [custom domains](/cloud/concepts/custom-domains) attached to your project, and the deploy purge clears them too.

## Related

- [Deployments](/cloud/concepts/deployments): the deploy that clears the cache.
- [Custom domains](/cloud/concepts/custom-domains): the CDN covers your custom domains too.
- [Static files](/concepts/web-server/static-files): the framework reference for `cacheControlFactory` and cache busting.
- [Single-page apps](/concepts/web-server/single-page-apps): serving another framework's single-page app with `SpaRoute`.
- [Flutter web apps](/concepts/web-server/flutter-web): serving a Flutter build from the framework web server.
