# Streams and messaging

For some applications, it's not enough to be able to call server-side methods. You may also want to push data from the server to the client or send data two-way. Examples include real-time games or chat applications. Luckily, Serverpod supports a framework for streaming data. It's possible to stream any serialized objects to or from any endpoint.

Serverpod supports two ways to stream data. The first approach, [streaming methods](#streaming-methods), imitates how `Streams` work in Dart and offers a simple interface that automatically handles the connection with the server. In contrast, the second approach, [streaming endpoint](#streaming-endpoints), requires developers to manage the web socket connection. The second approach was Serverpod's initial solution for streaming data but will be removed in future updates.

## Streaming Methods

When an endpoint method is defined with `Stream` instead of `Future` as the return type or includes `Stream` as a method parameter, it is recognized as a streaming method. Streaming methods transmit data over a shared, self-managed web socket connection that automatically connects and disconnects from the server.

### Defining a streaming method

Streaming methods are defined by using the `Stream` type as either the return value or a parameter.

Following is an example of a streaming method that echoes back any message:

```dart
class ExampleEndpoint extends Endpoint {
  Stream echoStream(Session session, Stream stream) async* {
    await for (var message in stream) {
      yield message;
    }
  }
}
```

The generic for the `Stream` can also be defined, e.g., `Stream<String>`. This definition is then included in the client, enabling static type validation.

The streaming method above can then be called from the client like this:

```dart
var inStream = StreamController();
var outStream = client.example.echoStream(inStream.stream);
outStream.listen((message) {
  print('Received message: $message');
});

inStream.add('Hello');
inStream.add(42);

// This will print
// Received message: Hello
// Received message: 42
```

In the example above, the `echoStream` method passes back any message sent through the `outStream`.

:::tip

Note that we can mix different types in the stream. This stream is defined as dynamic and can contain any type that can be serialized by Serverpod.

:::

### Lifecycle of a streaming method

Each time the client calls a streaming method, a new `Session` is created, and a call with that `Session` is made to the method endpoint on the server. The `Session` is automatically closed when the streaming method call is over.

If the web socket connection is lost, all streaming methods are closed on the server and the client.

When the streaming method is defined with a returning `Stream`, the method is kept alive until the stream subscription is canceled on the client or the method returns.

When the streaming method returns a `Future`, the method is kept alive until the method returns.

Streams in parameters are closed when the stream is closed. This can be done by either closing the stream on the client or canceling the subscription on the server.

All streams in parameters are closed when the method call is over.

### Error handling

Error handling works just like in regular endpoint methods in Serverpod. If an exception is thrown on a stream, the stream is closed with an exception. If the exception thrown is a serializable exception, the exception is first serialized and passed over the stream before it is closed.

This is supported in both directions; stream parameters can pass exceptions to the server, and return streams can pass exceptions to the client.

```dart
class ExampleEndpoint extends Endpoint {
  Stream echoStream(Session session, Stream stream) async* {
    stream.listen((message) {
      // Do nothing
    }, onError: (error) {
      print('Server received error: $error');
      throw SerializableException('Error from server');
    });
  }
}
```

```dart
var inStream = StreamController();
var outStream = client.example.echoStream(inStream.stream);
outStream.listen((message) {
  // Do nothing
}, onError: (error) {
  print('Client received error: $error');
});

inStream.addError(SerializableException('Error from client'));

// This will print
// Server received error: Error from client 
// Client received error: Error from server 
```

In the example above, the client sends an error to the server, which then throws an exception back to the client. And since the exception is serializable, it is passed over the stream before the stream is closed.

Read more about serializable exceptions here: [Serializable exceptions](exceptions).

## Streaming Endpoints

Streaming endpoints were Serverpod's first attempt at streaming data. This approach is more manual, requiring developers to manage the WebSocket connection to the server.

### Handling streams server-side

The Endpoint class has three methods you override to work with streams.

- `streamOpened` is called when a user connects to a stream on the Endpoint.
- `streamClosed` is called when a user disconnects from a stream on the Endpoint.
- `handleStreamMessage` is called when a serialized message is received from a client.

To send a message to a client, call the `sendStreamMessage` method. You will need to include the session associated with the user.

#### The user object

It's often handy to associate a state together with a streaming session. Typically, you do this when a stream is opened.

```dart
Future<void> streamOpened(StreamingSession session) async {
  setUserObject(session, MyUserObject());
}
```

You can access the user object at any time by calling the `getUserObject` method. The user object is automatically discarded when a session ends.

#### Internal server messaging

A typical scenario when working with streams is to pass on messages from one user to another. For instance, if one client sends a chat message to the server, the server should send it to the correct user. Serverpod comes with a built-in messaging system that makes this easy. You can pass messages locally on a single server, but messages are passed through Redis by default. Passing the messages through Redis makes it possible to send the messages between multiple servers in a cluster.

In most cases, it's easiest to subscribe to a message channel in the `streamOpened` method. The subscription will automatically be disposed of when the stream is closed. The following example will forward any message sent to a user identified by its user id.

```dart
@override
Future<void> streamOpened(StreamingSession session) async {
  final authenticationInfo = await session.authenticated;
  final userId = authenticationInfo?.userId;
  session.messages.addListener(
    'user_$userId',
    (message) {
      sendStreamMessage(session, message);
    },
  );
}
```

In your `handleStreamMessage` method, you can pass on messages to the correct channel.

```dart
@override
Future<void> handleStreamMessage(
  StreamingSession session,
  SerializableModel message,
) async {
  if (message is MyChatMessage) {
    session.messages.postMessage(
      'user_${message.recipientId}',
      message,
    );
  }
}
```

:::tip

For a real-world example, check out [Pixorama](https://pixorama.live). It's a multi-user drawing experience showcasing Serverpod's real-time capabilities and comes with complete source code.

:::

### Handling streams in your app

Before you can access streams in your client, you need to connect to the server's web socket. You do this by calling connectWebSocket on your client.

```dart
await client.openStreamingConnection();

```

You can monitor the state of the connection by adding a listener to the client.
Once connected to your server's web socket, you can pass and receive serialized objects.

Listen to its web socket stream to receive updates from an endpoint on the server.

```dart
await for (var message in client.myEndpoint.stream) {
  _handleMessage(message);
}
```

You send messages to the server's endpoint by calling `sendStreamMessage`.

```dart
client.myEndpoint.sendStreamMessage(MyMessage(text: 'Hello'));
```

:::info

Authentication is handled automatically. If you have signed in, your web socket connection will be authenticated.

:::
