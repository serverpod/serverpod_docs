# Sessions

The `Session` object is the central context for server operations in Serverpod. It provides access to the database, caching, authentication, file storage, messaging, and request information during method calls and streaming connections.

:::note

Don't confuse Session objects with user sessions. Session objects are request-scoped server contexts that exist only during a request, while user sessions are persistent authentication states. See the [Authentication documentation](./11-authentication/01-setup.md) for managing user sessions.

:::

## Core properties

Every `Session` provides access to these essential properties:

- **`db`**: Database access for queries and transactions. See [Database documentation](./06-database/01-connection.md)
- **`caches`**: Access to local and distributed caches. See [Caching documentation](./08-caching.md)
- **`storage`**: Cloud storage operations for files. See [File uploads documentation](./12-file-uploads.md)
- **`messages`**: Real-time messaging between sessions. See [Streams documentation](./15-streams.md)
- **`passwords`**: Passwords loaded from `config/passwords.yaml` and environment variables. See [Configuration documentation](./07-configuration.md)

## Session identification

Each session has unique identifiers and timing information:

- **`sessionId`**: A unique UUID for this session
- **`startTime`**: When the session was created
- **`endpoint`**: The endpoint that triggered this session
- **`method`**: The method name (may be null for some session types)

## Authentication

Sessions provide built-in authentication support:

```dart
// Check if a user is signed in
bool isSignedIn = await session.isUserSignedIn;

// Get authentication information
AuthenticationInfo? authInfo = await session.authenticated;
if (authInfo != null) {
  int userId = authInfo.userId;
  Set<Scope> scopes = authInfo.scopes;
}

// Update authentication (typically handled by auth modules)
session.updateAuthenticated(authInfo);
```

For authentication features like user management and auth providers, see the [Authentication documentation](./11-authentication/01-setup.md).

## Session types

Serverpod automatically creates different session types based on the request context and endpoint configuration:

### MethodCallSession

Created when a client makes a standard HTTP request to an endpoint method that returns `Future<T>`. This is the most common session type for REST-like API calls.

```dart
// This endpoint creates a MethodCallSession
Future<String> hello(Session session, String name) async {
  if (session is MethodCallSession) {
    // Access HTTP request details
    Uri uri = session.uri;
    String body = session.body;
    Map<String, dynamic> queryParams = session.queryParameters;
    Request httpRequest = session.request;
    
    // Access client information
    String remoteInfo = session.remoteInfo ?? 'unknown';
  }
  return 'Hello $name';
}
```

### MethodStreamSession

Created when an endpoint method returns `Stream<T>` or has stream parameters. The framework establishes a WebSocket connection and maintains it for the duration of the stream.

```dart
// This endpoint creates a MethodStreamSession
Stream<int> countToTen(Session session) async* {
  if (session is MethodStreamSession) {
    // Access the unique connection ID
    UuidValue connectionId = session.connectionId;
  }
  
  for (var i = 1; i <= 10; i++) {
    yield i;
    await Future.delayed(Duration(seconds: 1));
  }
}
```

### FutureCallSession

Created automatically by Serverpod when executing scheduled tasks. These sessions run in the background without any client connection.

```dart
// Schedule a task (this doesn't create a session yet)
await serverpod.futureCallWithDelay(
  'sendEmail',
  EmailData(to: 'user@example.com'),
  Duration(hours: 1),
);

// When the task executes, Serverpod creates a FutureCallSession
class SendEmailCall extends FutureCall {
  @override
  Future<void> invoke(Session session, SerializableModel? object) async {
    if (session is FutureCallSession) {
      String taskName = session.futureCallName; // 'sendEmail'
    }
    // Send the email
  }
}
```

### WebCallSession

Created when the web server handles HTTP requests to custom web routes (not API endpoints). Used for serving web pages, handling form submissions, and other web-specific operations.

```dart
// Configure a web route
webServer.addRoute(
  RouteRoot(
    path: '/hello',
    widget: MyWidget(),
  ),
  'hello',
);

// When someone visits /hello, a WebCallSession is created
class MyWidget extends Component {
  @override
  Future<Component> build(Session session) async {
    if (session is WebCallSession) {
      // Handle web-specific operations
      // Authentication is typically handled via cookies
    }
    return Text('Hello Web!');
  }
}
```

### InternalSession

Created for internal server operations that aren't triggered by client requests. Serverpod creates one persistent InternalSession at startup, and you can create additional ones for background tasks.

```dart
// Serverpod creates this automatically at startup
// Used for system operations, migrations, etc.

// You can create additional InternalSessions
var session = await Serverpod.instance.createSession(
  enableLogging: false,
);
try {
  // Perform background operations
  await User.db.deleteWhere(session, where: (t) => t.inactive);
} finally {
  await session.close();
}
```

## Working with sessions

### Logging

Sessions provide structured logging capabilities:

```dart
// Log at different levels
session.log('User action completed', level: LogLevel.info);
session.log('Warning condition', level: LogLevel.warning);

// Log with exceptions
try {
  // operation
} catch (e, stackTrace) {
  session.log('Operation failed', 
    level: LogLevel.error,
    exception: e,
    stackTrace: stackTrace
  );
}
```

### Session lifecycle

Sessions can have listeners for cleanup operations:

```dart
// Add a listener that runs when session closes
session.addWillCloseListener(() {
  // Cleanup code
});

// Remove listener if needed
session.removeWillCloseListener(listener);

// Get session duration
Duration duration = session.duration;
```

### Session closing

When a session closes, Serverpod performs several important cleanup operations to ensure resources are properly released and logs are finalized.

#### What happens during close

The `close()` method performs these operations in order:

1. **Executes will-close listeners** - All registered `WillCloseListener` callbacks run in the order they were added
2. **Removes message listeners** - All MessageCentral channel subscriptions for this session are cleaned up
3. **Finalizes logs** - Session logs are written to the database (if logging is enabled)
4. **Returns log ID** - The database ID of the session log entry (if applicable)

```dart
// Close with error information for logging
try {
  // Some operation
} catch (e, stackTrace) {
  await session.close(error: e, stackTrace: stackTrace);
  rethrow;
}
```

#### How different session types close

**Automatically closed sessions:**

- **MethodCallSession** - Closed automatically after the endpoint method returns, even if an exception occurs
- **WebCallSession** - Closed after handling the web request
- **FutureCallSession** - Closed after the scheduled task completes
- **MethodStreamSession** - Closed when the streaming method ends

**Manually closed sessions:**

- **InternalSession** - Must be explicitly closed with `session.close()`

#### Resource cleanup

During session close:

- **Database connections** are returned to the connection pool (not closed)
- **Message listeners** are automatically removed from all channels
- **Logs** are finalized and persisted to the database
- **Memory** used by the session is released

:::warning

**Important:** Sessions accumulate logs in memory until closed. Forgetting to close a manually created session will cause:

- Memory leaks as logs accumulate
- Logs never being written to the database
- Message listeners remaining active
- Potential performance degradation over time

:::

#### Best practices

Always use try-finally blocks for manual sessions:

```dart
var session = await Serverpod.instance.createSession();
try {
  // Perform operations
  await User.db.find(session);
} finally {
  // Ensures session closes even if an exception occurs
  await session.close();
}
```

Register cleanup operations with will-close listeners:

```dart
session.addWillCloseListener((session) async {
  // Clean up external resources
  await externalService.disconnect();
  
  // Cancel timers
  myTimer?.cancel();
});
```

### User state

For streaming endpoints, you can track custom state:

```dart
// Store custom data
session.userObject = MyCustomState();

// Retrieve it later
var state = session.userObject as MyCustomState;
```

## Database access

Sessions implement the `DatabaseAccessor` interface, providing full database capabilities:

```dart
// Direct database queries
var users = await User.db.find(session);

// Transactions
await session.db.transaction((transaction) async {
  // All queries here are part of the transaction
  await User.db.insertRow(session, user);
  await UserProfile.db.insertRow(session, profile);
});
```

## Caching

Access different cache levels through the session:

```dart
// Local cache (server-specific)
await session.caches.local.put('key', data, lifetime: Duration(minutes: 5));
var cached = await session.caches.local.get<MyData>('key');

// Priority cache for frequently accessed data
await session.caches.localPrio.put('important-key', data);

// Distributed cache (Redis, across cluster)
await session.caches.global.put('global-key', data);
```

## File storage

Manage cloud storage through the session:

```dart
// Store a file
await session.storage.storeFile(
  storageId: 'public',
  path: 'uploads/image.png',
  byteData: imageData,
);

// Retrieve a file
ByteData? data = await session.storage.retrieveFile(
  storageId: 'public',
  path: 'uploads/image.png',
);

// Get public URL
Uri? url = await session.storage.getPublicUrl(
  storageId: 'public',
  path: 'uploads/image.png',
);
```

## Messaging

Send messages between sessions:

```dart
// Listen for messages
session.messages.addListener('chat', (message) {
  print('Received: $message');
});

// Send a message to local server
await session.messages.postMessage('chat', MyMessage());

// Send globally across cluster
await session.messages.postMessage('chat', MyMessage(), global: true);

// Create a stream for messages
Stream<MyMessage> messages = session.messages.createStream<MyMessage>('chat');
```

## Creating sessions manually

While Serverpod typically manages sessions automatically, you can create them manually when needed:

```dart
// Create an InternalSession for background operations
InternalSession session = await Serverpod.instance.createSession(
  enableLogging: false,
);

try {
  // Perform operations
  await User.db.find(session);
} finally {
  // Always close manually created sessions
  await session.close();
}
```

:::warning

Always close manually created sessions to prevent memory leaks. Sessions store logs until closed.

:::

## Testing with sessions

Serverpod provides a `TestSessionBuilder` for integration testing. For detailed testing guidance, see the [Testing documentation](./19-testing/01-get-started.md).

```dart
withServerpod('test group', (sessionBuilder, endpoints) {
  test('endpoint test', () async {
    // Pass sessionBuilder directly to endpoints
    var result = await endpoints.myEndpoint.myMethod(sessionBuilder, 'param');
    expect(result, 'expected');
  });
  
  test('database test', () async {
    // Build a session for direct database access
    var session = sessionBuilder.build();
    await User.db.insertRow(session, user);
    
    // Verify the data
    var users = await User.db.find(session);
    expect(users.length, 1);
  });
});
```

The test framework automatically handles transactions and rollbacks based on your configuration.
