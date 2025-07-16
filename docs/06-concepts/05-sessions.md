# Sessions

The `Session` object is the central context for server operations in Serverpod. It provides access to the database, caching, authentication, file storage, messaging, and request information during method calls and streaming connections.

## Core properties

Every `Session` provides access to these essential properties:

- **`db`**: Database access for queries and transactions
- **`caches`**: Access to local and distributed caches
- **`storage`**: Cloud storage operations for files
- **`messages`**: Real-time messaging between sessions
- **`passwords`**: Passwords loaded from `config/passwords.yaml`
- **`server`**: The Server instance that created this session
- **`serverpod`**: Access to the Serverpod singleton via `server.serverpod`

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

Serverpod creates different session types based on the context:

### MethodCallSession

Created for endpoint method calls. Provides access to HTTP request data:

```dart
if (session is MethodCallSession) {
  Uri uri = session.uri;
  String body = session.body;
  Map<String, dynamic> queryParams = session.queryParameters;
  Request httpRequest = session.request;
  
  // Access client information
  String remoteInfo = session.remoteInfo ?? 'unknown';
}
```

### StreamingSession

Created for WebSocket connections. Allows dynamic endpoint updates:

```dart
if (session is StreamingSession) {
  session.updateAuthenticationKey(newKey);
  // Access WebSocket-specific properties
  Uri uri = session.uri;
  Map<String, String> queryParams = session.queryParameters;
}
```

### MethodStreamSession

Created for streaming endpoint connections with a unique connection ID:

```dart
if (session is MethodStreamSession) {
  UuidValue connectionId = session.connectionId;
}
```

### FutureCallSession

Created when executing scheduled future calls:

```dart
if (session is FutureCallSession) {
  String futureCallName = session.futureCallName;
}
```

### WebCallSession

Created for web server requests when handling custom web routes:

```dart
if (session is WebCallSession) {
  // Handle web-specific operations
}
```

### InternalSession

Used internally by Serverpod for operations outside client calls.

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

Serverpod provides a `TestSessionBuilder` for integration testing:

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
