# Sessions

A Session in Serverpod is a request-scoped context object that exists for the duration of a single client request or connection. It provides access to server resources and maintains state during request processing.

:::note

Sessions are not the same as user sessions. A Session object is created for every request and destroyed when the request completes, while user sessions represent persistent authentication states across multiple requests. See the [Authentication documentation](./11-authentication/01-setup.md) for managing user sessions.

:::

## Session lifecycle

Understanding the session lifecycle is crucial for proper resource management and avoiding common pitfalls in Serverpod applications.

### Creation phase

Sessions are created automatically by Serverpod when:

1. **HTTP request arrives** - A `MethodCallSession` is created for endpoint method calls
2. **WebSocket connects** - A `MethodStreamSession` is created for streaming endpoints
3. **Web route accessed** - A `WebCallSession` is created for custom web routes
4. **Scheduled task runs** - A `FutureCallSession` is created for future calls
5. **Manual creation** - An `InternalSession` is created via `Serverpod.instance.createSession()`

During creation, Serverpod:

- Generates a unique session ID
- Records the start time
- Initializes the logging system (if enabled)
- Sets up resource accessors (database, cache, storage, messaging)
- Stores the authentication key (if provided)

Each session type is created automatically based on the context - you don't create them manually.

### Active phase

During the active phase, the session:

1. **Provides lazy authentication** - Authentication is validated on first access to `session.authenticated`
2. **Accumulates logs in memory** - All log entries are cached until session close
3. **Tracks operation count** - Database queries are counted for monitoring
4. **Maintains request context** - Endpoint name, method, and other metadata remain accessible

```dart
Future<User?> getUser(Session session, int userId) async {
  // Authentication is checked here on first access (lazy loading)
  var authInfo = await session.authenticated;
  if (authInfo == null) {
    throw UnauthorizedException();
  }

  // Logs accumulate in memory
  session.log('Fetching user $userId');

  // Database operations are tracked
  return await User.db.findById(session, userId);
}
```

### Destruction phase

Sessions are closed either automatically or manually:

**Automatic closure:**

- Method calls: Closed automatically after the endpoint method completes
- Streaming: Closed when the WebSocket connection ends
- Future calls: Closed after the scheduled task completes

**Manual closure:**

- Internal sessions must be explicitly closed with `session.close()`

During closure, Serverpod:

1. **Prevents further operations** - The session becomes unusable
2. **Executes will-close listeners** - Runs any registered cleanup callbacks
3. **Removes message listeners** - Cleans up all channel subscriptions
4. **Finalizes logs** - Writes accumulated logs to the database
5. **Returns session log ID** - For debugging and tracing

### Invalid session usage

Using a session after it's closed throws a `StateError`:

```dart
Future<void> badExample(Session session) async {
  var data = await fetchData(session);

  // DON'T DO THIS - Session closes when method returns
  Timer(Duration(seconds: 1), () {
    // This will throw: StateError: Session is closed, and logging
    // can no longer be performed.
    session.log('Delayed log'); // ❌ Session already closed!
  });

  return data;
}
```

## Authentication flow

Authentication in sessions follows a lazy-loading pattern:

1. **Authentication key passed** - Client sends auth key in header or query parameter
2. **Key stored in session** - Session stores the key but doesn't validate yet
3. **First access triggers validation** - Calling `session.authenticated` runs the authentication handler
4. **Result cached** - Authentication info is cached for the session lifetime

This lazy pattern means:

- Unauthenticated endpoints don't pay the authentication cost
- Authentication errors only occur when actually checking authentication
- Multiple calls to `session.authenticated` don't re-validate

## Logging mechanics

The session logging system is designed to batch operations for performance:

### Memory accumulation

During the session lifetime:

- All log entries are stored in memory
- Database queries are tracked with timing information
- Message logs record endpoint execution time
- No database writes occur until session close

```dart
// Logs accumulate in memory during the session
session.log('Starting process');              // Stored in memory
var result = await complexOperation(session); // Queries tracked
session.log('Process complete');               // Still in memory
// All logs written to database when session closes
```

### Write timing

**Method calls**: Logs are written once when the session closes

```dart
// Logs written after method completes
Future<String> myMethod(Session session) async {
  session.log('Step 1');
  session.log('Step 2');
  return 'done';
  // <- Logs written to database here
}
```

**Streaming sessions**: Can be configured for continuous or batched logging

```dart
// In config: logStreamingSessionsContinuously: true
Stream<int> count(Session session) async* {
  for (var i = 0; i < 10; i++) {
    session.log('Count: $i'); // Written immediately if configured
    yield i;
  }
}
```

### Configuration impact

Logging behavior is controlled by `LogSettings`:

- `logAllSessions`: Log every session
- `logSlowSessions`: Only log sessions exceeding duration threshold
- `logFailedSessions`: Only log sessions that throw exceptions
- `logLevel`: Minimum level for log entries (debug, info, warning, error)

### Lost logs

If a session isn't properly closed:

- Logs remain in memory and are never written
- Memory usage grows until the process restarts
- Debugging information is permanently lost

## Common pitfalls and solutions

### Pitfall 1: Using session after method returns

**Problem:**

```dart
Future<void> processUser(Session session, int userId) async {
  var user = await User.db.findById(session, userId);

  // Schedule async work
  Timer(Duration(seconds: 5), () async {
    // ❌ Session is already closed!
    await user.updateLastSeen(session);
  });

  return; // Session closes here
}
```

**Solution 1 - Use FutureCalls:**

```dart
Future<void> processUser(Session session, int userId) async {
  var user = await User.db.findById(session, userId);

  // Schedule through Serverpod
  await session.serverpod.futureCallWithDelay(
    'updateLastSeen',
    UserIdData(userId: userId),
    Duration(seconds: 5),
  );

  return;
}
```

**Solution 2 - Create manual session:**

```dart
Future<void> processUser(Session session, int userId) async {
  var user = await User.db.findById(session, userId);

  Timer(Duration(seconds: 5), () async {
    // Create new session for async work
    var newSession = await Serverpod.instance.createSession();
    try {
      await user.updateLastSeen(newSession);
    } finally {
      await newSession.close();
    }
  });

  return;
}
```

### Pitfall 2: Forgetting to close manual sessions

**Problem:**

```dart
// ❌ Memory leak!
var session = await Serverpod.instance.createSession();
var users = await User.db.find(session);
// Forgot to close - session leaks memory
```

**Solution - Always use try-finally:**

```dart
var session = await Serverpod.instance.createSession();
try {
  var users = await User.db.find(session);
  // Process users
} finally {
  await session.close(); // Always runs
}
```

### Pitfall 3: Accessing global cache without Redis

**Problem:**

```dart
// ❌ Throws assertion error if Redis not enabled
await session.caches.global.put('key', data);
```

**Solution - Enable Redis in config:**

```yaml
# config/development.yaml
redis:
  enabled: true # Default is false
  host: localhost
  port: 6379
```

Or check before using:

```dart
// Use local cache as fallback
if (Features.enableRedis) {
  await session.caches.global.put('key', data);
} else {
  await session.caches.local.put('key', data);
}
```

## Working with different session types

Understanding when each session type appears in your code:

### MethodCallSession - Standard API calls

Created for: `Future<T>` endpoint methods
Lifetime: Single request-response cycle
Common in: User authentication, data fetching, CRUD operations

```dart
Future<String> hello(Session session, String name) async {
  // You're working with a MethodCallSession here
  // It will close automatically after this method returns
  return 'Hello $name';
}
```

### MethodStreamSession - Real-time communication

Created for: `Stream<T>` endpoint methods or stream parameters
Lifetime: Duration of the stream
Common in: Chat applications, live notifications, real-time collaboration

```dart
Stream<Message> chat(Session session, Stream<String> incoming) async* {
  // MethodStreamSession stays open for the stream duration
  await for (var message in incoming) {
    yield Message(text: message, time: DateTime.now());
  }
  // Closes when stream completes
}
```

### FutureCallSession - Background tasks

Created for: Scheduled operations
Lifetime: Task execution duration
Common in: Email sending, report generation, data cleanup

```dart
class EmailSender extends FutureCall {
  @override
  Future<void> invoke(Session session, EmailData? data) async {
    // FutureCallSession created just for this task
    await sendEmail(session, data!);
    // Closes when task completes
  }
}
```

### InternalSession - System operations

Created for: Manual background work
Lifetime: Until explicitly closed
Common in: Database migrations, batch imports, maintenance tasks

```dart
// Cleanup old data periodically
Future<void> cleanupOldData() async {
  var session = await Serverpod.instance.createSession(
    enableLogging: false, // Often disabled for system tasks
  );
  try {
    await OldData.db.deleteWhere(
      session,
      where: (t) => t.createdAt < DateTime.now().subtract(Duration(days: 90)),
    );
  } finally {
    await session.close(); // Must close manually
  }
}
```

## Best practices

### 1. Let Serverpod manage sessions when possible

Prefer using the session provided to your endpoint rather than creating new ones:

```dart
// ✅ Good - Use provided session
Future<List<User>> getActiveUsers(Session session) async {
  return await User.db.find(
    session,
    where: (t) => t.isActive.equals(true),
  );
}

// ❌ Avoid - Creating unnecessary session
Future<List<User>> getActiveUsers(Session session) async {
  var newSession = await Serverpod.instance.createSession();
  try {
    return await User.db.find(newSession, ...);
  } finally {
    await newSession.close();
  }
}
```

### 2. Use FutureCalls for delayed operations

Instead of managing sessions for async work, use Serverpod's future call system:

```dart
// ✅ Good - Let Serverpod manage the session
await serverpod.futureCallWithDelay(
  'processPayment',
  PaymentData(orderId: order.id),
  Duration(hours: 1),
);

// ❌ Complex - Manual session management
Future.delayed(Duration(hours: 1), () async {
  var session = await Serverpod.instance.createSession();
  try {
    await processPayment(session, order.id);
  } finally {
    await session.close();
  }
});
```

### 3. Register cleanup with will-close listeners

For custom resources that need cleanup:

```dart
Future<void> processWithExternalService(Session session) async {
  var service = await ExternalService.connect();

  // Ensure cleanup even if session closes unexpectedly
  session.addWillCloseListener((session) async {
    await service.disconnect();
  });

  // Use service...
}
```

### 4. Handle errors properly

Pass exceptions to session close for proper logging:

```dart
var session = await Serverpod.instance.createSession();
try {
  await riskyOperation(session);
} catch (e, stackTrace) {
  // Logs error information with the session
  await session.close(error: e, stackTrace: stackTrace);
  rethrow;
}
// Normal close if no error
await session.close();
```

## Quick reference

### Essential properties

- **`db`** - Database access. [See database docs](./06-database/01-connection.md)
- **`caches`** - Local and distributed caching. [See caching docs](./08-caching.md)
- **`storage`** - File storage operations. [See file uploads](./12-file-uploads.md)
- **`messages`** - Inter-session messaging. [See streams docs](./15-streams.md)
- **`passwords`** - Credentials from config and environment. [See configuration](./07-configuration.md)

### Key methods

- **`authenticated`** - Get authentication info (lazy-loaded)
- **`isUserSignedIn`** - Quick auth check
- **`log(message, level)`** - Add log entry
- **`close(error, stackTrace)`** - Manual session cleanup
- **`addWillCloseListener(callback)`** - Register cleanup callback

### Testing

Use `TestSessionBuilder` in integration tests. [See testing docs](./19-testing/01-get-started.md)

```dart
withServerpod('test group', (sessionBuilder, endpoints) {
  test('endpoint test', () async {
    var result = await endpoints.users.getUser(sessionBuilder, 123);
    expect(result.name, 'John');
  });
});
```
