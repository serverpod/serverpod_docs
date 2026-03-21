---
sidebar_position: -1
sidebar_label: Introduction
sidebar_class_name: sidebar-introduction-icon
---

# Introduction

Serverpod is an open-source, scalable backend framework built specifically for Flutter developers. It allows you to use Dart for your entire stack, simplifying development and reducing context-switching.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/teOnBD5d8b8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Build your Flutter backend with Dart

Maintain a single-language codebase with Serverpod. Write backend endpoints in Dart and call them directly from your Flutter app without writing boilerplate code. Our state-of-the-art code generation takes care of all the steps in between. Under the hood, Serverpod uses proven web standards and best practices.

```dart
// Define an endpoint on the server.
class ExampleEndpoint extends Endpoint {
  Future<String> greet(Session session, String name) async {
    return 'Hello, $name';
  }
}
```

```dart
// Call the endpoint from your Flutter app.
final greeting = await client.example.greet('World');
print(greeting); // Hello World
```

### Scalable and progressive

Serverpod is designed to grow with your needs. Start with a minimal setup and gradually introduce complexity as your application evolves:

- **Modular:** Easily add new features or services when necessary.
- **Scalable:** Grows from hobby project to millions of active users without changing a line of code.
- **Flexible:** Adaptable to various project requirements. Plug in Redis or stay purely Postgres – your choice.

### Benefits of Serverpod

Startups and agencies use Serverpod to streamline development processes, accelerate iteration cycles, and empower single developers to build full features:

- **Reduced complexity:** Minimize friction by using a single language. Modules make sharing app and server code, database schemas, and APIs between your projects easy.
- **Open and free:** Avoid vendor lock-in. Deploy servers anywhere you can run Dart.
- **Stable and reliable:** Integrated logging, error monitoring, and automated database management. Battle-tested in real-world applications and secured by over 5,000 automated tests.

### Features our developers love

Serverpod comes packed with powerful features - batteries included.

- **Intuitive ORM:** Eliminates the need for writing complex SQL and reduces the risk of database errors – all Dart-first, type-safe, statically analyzed, and with support for migrations and relations.
- **Real-time capabilities:** Push data from your server using Dart streams without worrying about the WebSocket life cycle and message routing.
- **Straightforward authentication:** Quickly integrate popular authentication providers like sign-in with Google, Apple, or Firebase.
- **All essentials covered:** Built-in support for common tasks like handling file uploads, scheduling tasks, and caching data.
- **Cloud ready:** Deploy to Serverpod Cloud with zero configuration (coming soon - **[join the waiting list](https://forms.gle/JgFCqW3NY6WdDfct5)**), use pre-configured Docker containers, or use Terraform scripts for deploying to AWS or Google Cloud.
