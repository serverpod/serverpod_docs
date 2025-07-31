# Sessions

A Session in Serverpod is a request-scoped context object that exists for the duration of a single client request or connection. It provides access to server resources and maintains state during request processing.

Sessions are the gateway to Serverpod's functionality - every interaction with the database, cache, file storage, or messaging system happens through a session. The framework automatically creates the appropriate session type when a client makes a request, manages its lifecycle, and ensures proper cleanup when the request completes. For special cases like background tasks or system operations, you can also create and manage sessions manually.

:::note

A Serverpod Session should not be confused with the concept of "web sessions" or "user sessions" which persist over multiple API calls. See the [Authentication documentation](./11-authentication/01-setup.md) for managing persistent authentication.

:::

## Session types

### Automatic sessions

These sessions are automatically managed by Serverpod - created when a request arrives and closed when the request completes:

#### MethodCallSession - Standard API calls

Created for: `Future<T>` endpoint methods  
Lifetime: Single request-response cycle  
Common in: Data fetching, CRUD operations, business logic

```dart
Future<String> hello(Session session, String name) async {
  // You're working with a MethodCallSession here
  // It will close automatically after this method returns
  return 'Hello $name';
}
```

#### WebCallSession - Web server routes

Created for: HTTP requests to web server routes  
Lifetime: Single request-response cycle  
Common in: Serving web pages, handling form submissions, REST APIs

```dart
// In your web server setup
webServer.get('/hello', (request, response) async {
  // WebCallSession is created for web routes
  var session = request.session as WebCallSession;
  
  // Access Serverpod resources through the session
  var data = await MyData.db.find(session);
  
  response.send('Hello from web route');
  // Session closes when response is sent
});
```

#### MethodStreamSession - Streaming methods

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

#### StreamingSession - WebSocket connections

Created for: Persistent WebSocket connections  
Lifetime: Duration of the WebSocket connection  
Common in: Real-time updates, live dashboards, multiplayer games

```dart
class MyController extends StreamingEndpoint {
  @override
  Future<void> handleStreamMessage(
    StreamingSession session, 
    SerializableModel message,
  ) async {
    // StreamingSession shared across all streams in the WebSocket
    // Stays open until WebSocket disconnects
    if (message is ChatMessage) {
      sendStreamMessage(session, message);
    }
  }
}
```

#### FutureCallSession - Background tasks

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

### Manual sessions

These sessions require explicit lifecycle management by the developer:

#### InternalSession - System operations

Created for: Internal framework operations and manual background work  
Lifetime: Until explicitly closed (manual sessions only)  
Common in: Database migrations, batch imports, maintenance tasks, framework internals

#### Managing InternalSession lifecycle

Unlike the automatic sessions, InternalSessions require manual lifecycle management:

**1. Creation** - You explicitly create the session:
```dart
var session = await Serverpod.instance.createSession(
  enableLogging: false, // Optional: disable logging for system tasks
);
```

**2. Active phase** - The session remains active indefinitely until you close it:
- Full access to all Serverpod resources (database, cache, storage)
- Logs accumulate in memory if logging is enabled
- No automatic timeout or cleanup
- Can be passed between functions and used across async boundaries

**3. Manual closure** - You MUST close the session:
```dart
await session.close(); // Required - releases resources and writes logs
```

**4. After closure:**
- Session becomes unusable (operations throw `StateError`)
- Accumulated logs are written to database (if logging was enabled)
- Database connections are released
- Memory is freed

#### Best practices for InternalSession

Always use try-finally to ensure closure:

```dart
// ✅ Good - Guaranteed cleanup
Future<void> performMaintenance() async {
  var session = await Serverpod.instance.createSession();
  try {
    // Perform database operations
    await cleanupOldRecords(session);
    await updateStatistics(session);
    await optimizeIndexes(session);
  } finally {
    await session.close(); // Always executes
  }
}

// ❌ Bad - Session leaks if error occurs
Future<void> riskyOperation() async {
  var session = await Serverpod.instance.createSession();
  await performDangerousOperation(session); // If this throws...
  await session.close(); // This never runs! Memory leak!
}
```

Common use cases:

```dart
// Scheduled maintenance tasks
Future<void> dailyCleanup() async {
  var session = await Serverpod.instance.createSession(
    enableLogging: false, // Skip logging for routine tasks
  );
  try {
    await OldData.db.deleteWhere(
      session,
      where: (t) => t.createdAt < DateTime.now().subtract(Duration(days: 90)),
    );
  } finally {
    await session.close();
  }
}

// Background processing
Future<void> processUploadedFile(String filePath) async {
  var session = await Serverpod.instance.createSession();
  try {
    var data = await parseFile(filePath);
    await ImportedData.db.insertRows(session, data);
    session.log('Imported ${data.length} records');
  } catch (e) {
    session.log('Import failed: $e', level: LogLevel.error);
    rethrow;
  } finally {
    await session.close();
  }
}
```

## Session lifecycle

Understanding the session lifecycle is crucial for proper resource management and avoiding common pitfalls in Serverpod applications.

```mermaid
flowchart TB
    Request([Client Request]) --> Create[Session Created]
    Create --> Init[Initialize]
    Init --> Active[Execute Endpoint Method]
    Active --> Close[Close Session]
    Close --> End([Request Complete])
```

### Client Request → Session Created

When a client makes a request to your Serverpod server, the framework automatically creates the appropriate session type:

1. **HTTP request to API endpoint** → `MethodCallSession` for endpoint method calls
2. **HTTP request to web route** → `WebCallSession` for web server routes
3. **WebSocket stream** → `MethodStreamSession` for streaming endpoints
4. **WebSocket connection** → `StreamingSession` for real-time connections
5. **Scheduled task** → `FutureCallSession` for future calls
6. **Internal operations** → `InternalSession` created by framework or manually via `Serverpod.instance.createSession()`

### Initialize

Once Serverpod determines the session type, it creates and initializes the session:

- Generates a unique session ID (`UuidValue`)
- Records the start time
- Sets up the logging system (if enabled in configuration)
- Initializes resource accessors (database, cache, storage, messaging)

Sessions are normally created automatically by the framework. The exception is `InternalSession`, which you create manually for background tasks.

### Execute Endpoint Method

During method execution, the session provides access to all server resources:

1. **Logging** - Log entries accumulate in memory during execution (non-streaming endpoints) or written immediately (streaming endpoints)
2. **Database operations** - Queries are counted, timed, and logged
3. **Request context** - Endpoint name, method, and metadata remain accessible

```dart
// Example: Using session resources during execution
Future<User?> getUser(Session session, int userId) async {
  // Logs accumulate in memory
  session.log('Fetching user $userId');

  // Database operations are tracked
  return await User.db.findById(session, userId);
}
```

### Close Session

Sessions close either automatically or manually:

**Automatic closure:**

- Method calls: After the endpoint method returns
- Streaming methods: After the stream completes
- Streaming endpoints: When the WebSocket connection ends  
- Future calls: After the scheduled task completes


When closing, the session:

1. Becomes unusable (further operations throw `StateError`)
2. Executes any cleanup callbacks registered with `addWillCloseListener()`
3. Removes all message channel subscriptions

#### Cleanup callbacks

For custom resources that need cleanup when a session closes:

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

### Request Complete

Once the session closes, all resources are released and any accumulated logs are written to the database (see [Logging](#logging) for details).

## Logging

The session logging system is designed to batch operations for performance (default behavior):

### How logs are written

After the session closes, all accumulated logs are written to the database in a single batch:

- All log entries stored in memory during execution are persisted
- Database query timings and counts are recorded
- Session metadata (duration, endpoint, method) is saved
- Returns a session log ID for debugging and tracing

### Write timing

**Method calls**: Logs are written once when the session closes (default)

```dart
// Logs written after method completes
Future<String> myMethod(Session session) async {
  session.log('Step 1');
  session.log('Step 2');
  return 'done';
  // <- Logs written to database here
}
```

**Streaming sessions**: Write logs continuously by default

```dart
Stream<int> count(Session session) async* {
  for (var i = 0; i < 10; i++) {
    session.log('Count: $i'); // Written immediately
    yield i;
  }
}
```

### Lost logs

If a session isn't properly closed:

- Logs remain in memory and are never written
- Memory usage grows until the process restarts
- Debugging information is permanently lost

## Common pitfalls and solutions

### Pitfall 1: Using session after method returns

**Problem:** Using a session after it's closed throws a `StateError`

```dart
Future<void> processUser(Session session, int userId) async {
  var user = await User.db.findById(session, userId);

  // Schedule async work
  Timer(Duration(seconds: 5), () async {
    // ❌ Session is already closed!
    // This will throw: StateError: Session is closed
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

### 3. Handle errors properly

Always handle exceptions to prevent unclosed sessions:

```dart
// ✅ Good - Errors won't prevent session cleanup
Future<void> safeOperation() async {
  var session = await Serverpod.instance.createSession();
  try {
    await riskyOperation(session);
  } catch (e) {
    session.log('Operation failed: $e', level: LogLevel.error);
    // Handle error appropriately
  } finally {
    await session.close();
  }
}
```

## Quick reference

### Essential properties

- **`db`** - Database access. [See database docs](./06-database/01-connection.md)
- **`caches`** - Local and distributed caching. [See caching docs](./08-caching.md)
- **`storage`** - File storage operations. [See file uploads](./12-file-uploads.md)
- **`messages`** - Server events for real-time communication. [See server events docs](./16-server-events.md)
- **`passwords`** - Credentials from config and environment. [See configuration](./07-configuration.md)

### Key methods

- **`log(message, level)`** - Add log entry
- **`close(error, stackTrace)`** - Manual session cleanup
- **`addWillCloseListener(callback)`** - Register cleanup callback

### Testing

When testing endpoints, you need a way to create valid sessions without going through the full HTTP request cycle. The `TestSessionBuilder` provides a controlled environment for integration tests, allowing you to:

- Test endpoints directly without HTTP overhead
- Configure authentication state for testing protected endpoints
- Access the same session context your endpoints would receive in production

For detailed testing strategies, see the [testing documentation](./19-testing/01-get-started.md).

```dart
withServerpod('test group', (sessionBuilder, endpoints) {
  test('endpoint test', () async {
    var result = await endpoints.users.getUser(sessionBuilder, 123);
    expect(result.name, 'John');
  });
});
```
