---
sidebar_position: -1
sidebar_label: Introduction
sidebar_class_name: sidebar-introduction-icon
title: Introduction
description: Serverpod is an open-source backend framework for Flutter developers. Write your server in Dart and call it from Flutter through a generated, type-safe client.
---

# Introduction

Serverpod is an open-source backend framework for Flutter developers. You write server logic in Dart, define data models in YAML, and call your endpoints from Flutter through a generated, type-safe Dart client. No REST contracts to hand-write, no language-switching, no boilerplate to maintain.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/teOnBD5d8b8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Write Dart everywhere

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

Endpoint methods on the server become typed methods on the client. Serverpod handles serialization, transport, and the code generation in between.

## Who Serverpod is for

Serverpod is built for Flutter teams that want a Dart-only stack: solo developers, startups, and small teams shipping production apps without juggling languages. If your client is Flutter, your team writes Dart, and you'd rather ship features than wire infrastructure, Serverpod fits.

## What's included

Serverpod covers the common backend surface out of the box:

- **Code generation:** Server endpoints become typed Dart methods on the client. No hand-written API contracts.
- **Fast dev loop:** `serverpod start` regenerates the client, hot reloads the server, and applies migrations as you edit. No manual rebuilds or restarts.
- **Type-safe ORM:** Query Postgres or SQLite with Dart. Filters, relations, and joins are checked at compile time. Schema changes ship as versioned migrations.
- **Client-side database:** Use the same models on the Flutter client through a generated local database, including migrations.
- **Authentication:** Sign in with Google, Apple, Firebase, or email and password. Custom providers supported.
- **Real-time streams:** Stream Dart objects to clients over WebSockets without writing connection-management code.
- **Deployment:** Deploy to Serverpod Cloud, or self-host with Docker, Terraform scripts, or your own infrastructure.
- **Logging and monitoring:** Inspect requests, exceptions, and slow queries with Serverpod Insights.
- **File uploads:** Store in Amazon S3, Google Cloud Storage, or your database.
- **Task scheduling:** Run code at a future time with future calls. Persists across server restarts.
- **Caching:** Cache primitives and serializable models in-process or in Redis.
- **Web server:** Serve REST APIs, webhooks, and web pages with the built-in [Relic](https://docs.dartrelic.dev/) HTTP server.
