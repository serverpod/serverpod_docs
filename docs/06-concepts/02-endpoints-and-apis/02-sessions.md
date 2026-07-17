---
description: The Session object gives every endpoint call access to the database, cache, file storage, and messaging, and manages its own lifecycle and logging.
---

# Sessions

Every endpoint method receives a `Session` object. It is the entry point for the database, cache, file storage, and messaging system. Serverpod creates and closes sessions automatically for endpoint calls. For background work, you create one yourself, most easily with [`withSession`](#create-a-session-for-background-work).

:::note

A Serverpod Session should not be confused with the concept of "web sessions" or "user sessions" which persist over multiple API calls. See the [Authentication documentation](../authentication/setup) for managing persistent authentication.

:::

## Session types

Serverpod creates a session for every unit of work it runs, and the type reflects what triggered it. You will see these names in your [logs](../operations/logging) and in Insights when tracing a call:

| Type                    | Created for                                                                                                   | Lifetime            | Typical uses                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------- |
| **MethodCallSession**   | `Future` [endpoint methods](../endpoints-and-apis)                                                            | Single request      | API calls, CRUD operations   |
| **WebCallSession**      | [Web server](../web-server/overview) routes                                                                   | Single request      | Web pages, form submissions  |
| **MethodStreamSession** | [Streaming methods](./streaming)                                                                              | Stream duration     | Real-time updates, chat      |
| **StreamingSession**    | WebSocket connections of the [deprecated streaming endpoints API](./streaming#streaming-endpoints-deprecated) | Connection duration | Legacy real-time code        |
| **FutureCallSession**   | [Scheduled tasks](../scheduling/setup)                                                                        | Task execution      | Email sending, batch jobs    |
| **InternalSession**     | [Manual creation](#create-a-session-for-background-work)                                                      | Until closed        | Background work, migrations  |

You rarely choose a type yourself: your endpoint methods receive the right one, and manual creation always produces an `InternalSession`.

```dart
class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    // A MethodCallSession was created for this call, and it closes
    // automatically when the method returns.
    return 'Hello $name';
  }
}
```

## What a session provides

| Member                      | What it is                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `db`                        | Database access. See the [database docs](../data-and-the-database/database/connection).         |
| `caches`                    | Local and distributed caching. See [caching](../operations/caching).                            |
| `storage`                   | File storage. See [file uploads](./file-uploads).                                               |
| `messages`                  | Server events for real-time communication. See [server events](./server-events).                |
| `passwords`                 | Secrets from config and environment. See [configuration](../server-fundamentals/configuration). |
| `authenticated`             | The current user's authentication info. See [authentication](../authentication/basics).         |
| `log(...)`                  | Write a log entry tied to this session. See [logging](#logging).                                |
| `addWillCloseListener(...)` | Register a cleanup callback that runs before the session closes.                                |
| `serverpod`                 | The running Serverpod instance, for example for [future calls](../scheduling/setup).            |

## Session lifecycle

Serverpod creates the session when the request or task starts and closes it when the work completes. Closing finalizes the session's log and releases its resources. The exception is `InternalSession`: you [create it yourself](#create-a-session-for-background-work), so you close it yourself.

### Run cleanup when a session closes

Register callbacks that execute just before a session closes with `addWillCloseListener`. This is useful for releasing resources or performing final operations:

```dart
Future<void> processData(Session session) async {
  var tempFile = File('/tmp/processing_data.tmp');

  session.addWillCloseListener((session) async {
    if (await tempFile.exists()) {
      await tempFile.delete();
      session.log('Cleaned up temporary file');
    }
  });

  await tempFile.writeAsString('processing...');
  // The session closes automatically after the method returns,
  // and the cleanup callback runs.
}
```

Cleanup callbacks run in the order they were registered and fire for all session types, including manual sessions when you call `session.close()`.

## Create a session for background work

Inside an endpoint method, use the session you were given. It is already managed for you. When code runs outside a call, such as startup work in `run()` or a background job, create a session with `withSession`, which builds an `InternalSession`, runs your callback, and closes the session afterwards:

```dart
await pod.withSession((session) async {
  await cleanupOldRecords(session);
  await updateStatistics(session);
});
```

If the callback throws, the session is closed with the error and stack trace attached, so they reach the logs, and the error is rethrown.

If you need to manage the lifetime yourself, create the session manually and close it when done. An unclosed session is never finalized and its resources are not released, so pair `createSession` with a `finally`:

```dart
var session = await Serverpod.instance.createSession();
try {
  var users = await User.db.find(session);
  // Process users.
} finally {
  await session.close();
}
```

## Run work after the call returns

The session that an endpoint method receives closes when the method returns, so do not capture it in timers or delayed callbacks:

```dart
Future<void> processUser(Session session, int userId) async {
  Timer(Duration(seconds: 5), () async {
    // Do not do this: this session closed when processUser returned,
    // and this callback runs outside any managed lifetime.
    await updateLastSeen(session, userId);
  });
}
```

Schedule the work as a [future call](../scheduling/setup) instead. Future calls survive server restarts and receive their own session when they run:

```dart
Future<void> processUser(Session session, int userId) async {
  await session.serverpod.futureCalls
      .callWithDelay(const Duration(seconds: 5))
      .userMaintenance
      .updateLastSeen(userId);
}
```

For one-off work that can run immediately and does not need to survive a restart, `withSession` inside the callback is the lighter alternative.

## Logging

Use `session.log` to write log entries tied to the session. Entries are persisted according to your [session log configuration](../operations/logging), and closing the session finalizes its log. Sessions for [streaming methods](./streaming) are the exception: they write entries continuously while the stream is open, so a long-lived stream appears in your logs before it ends. This is on by default in the runtime log settings. See [Logging](../operations/logging) for storage, retention, and console output.

```dart
session.log('Processing started');
session.log('Something looks off', level: LogLevel.warning);
```

## Test with sessions

The test tools provide a `sessionBuilder` for calling endpoints in tests and simulating session state such as authentication. See [Get started with testing](../testing/get-started) and [the basics](../testing/the-basics) for the patterns.

## Related

- [Working with endpoints](../endpoints-and-apis): the methods that receive sessions.
- [Scheduling](../scheduling/setup): future calls, the managed way to run delayed work.
- [Logging](../operations/logging): where session log entries go.
- [Authentication](../authentication/basics): what `session.authenticated` holds.
