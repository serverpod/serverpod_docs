---
sidebar_position: -1
sidebar_label: Introduction
sidebar_class_name: sidebar-introduction-icon
title: Introduction
description: Serverpod is an open-source backend framework for Flutter developers. Write your server in Dart and call it from your app through generated, type-safe code.
---

# Introduction

Serverpod is an open-source backend framework for Flutter developers. You write server logic in Dart, define data models in YAML, and call your endpoints from your Flutter app through generated, type-safe Dart code. No REST contracts to hand-write, no language-switching, no boilerplate to maintain.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/teOnBD5d8b8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Build with Dart everywhere

Define an endpoint on the server:

```dart
class GreetingEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello, $name';
  }
}
```

Call it from your Flutter app:

```dart
final greeting = await client.greeting.hello('World');
print(greeting); // Hello, World
```

Endpoint methods on the server become typed methods in your app. Serverpod handles serialization, transport, and the code generation in between.

## Who Serverpod is for

Serverpod is built for Flutter teams that want a Dart-only stack: solo developers, app agencies, startups, and small teams shipping production apps without juggling languages. If your app uses Flutter, your team already knows Dart. If you'd rather ship features than struggle with infrastructure, Serverpod is a good fit.

## What's included

Serverpod covers all common backend needs out of the box:

- **Code generation:** Server endpoints and the app stay in sync automatically. Define a method on the server, call it from the app as if it were local Dart code.
- **Fast dev loop:** `serverpod start` hot reloads your app, server, database, generated code, and web pages. No manual rebuilds or restarts.
- **Type-safe ORM:** Query Postgres or SQLite with Dart. Filters, relations, and joins are checked at compile time. Schema changes ship as versioned migrations.
- **Client-side database:** Use the same models in your Flutter app through a generated local database, including migrations.
- **Authentication:** Built-in sign-in with Google, Apple, GitHub, Microsoft, Firebase, email/password, passkeys, and more. Anonymous and custom providers supported.
- **Real-time streams:** Stream Dart objects to your app over WebSockets without writing connection-management code.
- **Deployment:** Deploy to Serverpod Cloud, or self-host with Docker, Terraform, or your own infrastructure. No vendor lock-in.
- **Logging and monitoring:** Inspect requests, exceptions, and slow queries with [Serverpod Insights](./10-tools/01-insights.md), the desktop app that ships with Serverpod.
- **File uploads:** Store in Amazon S3, Google Cloud Storage, or your database.
- **Task scheduling:** Schedule a method to run later with type-safe future calls. They persist across server restarts.
- **Caching:** Cache primitives and serializable models in-memory or in Redis.
- **Web server:** Serve REST APIs, webhooks, and web pages with the built-in [web server](./06-concepts/05-web-server/01-overview.md), based on [Relic](https://docs.dartrelic.dev/).
