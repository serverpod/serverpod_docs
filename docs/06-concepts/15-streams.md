# Streams

For some applications, it's not enough to be able to call server-side methods. You may also want to push data from the server to the Flutter app or send data two-way. Examples include real-time games or chat applications. Luckily, Serverpod supports a framework for streaming data. It's possible to stream any serialized objects to or from any endpoint.

Serverpod supports streaming data through [streaming methods](#streaming-methods), which imitate how `Streams` work in Dart and offer a simple interface that automatically handles the connection with the server.

:::tip

For a real-world example, check out [Pixorama](https://pixorama.live). It's a multi-user drawing experience showcasing Serverpod's real-time capabilities and comes with complete source code.

:::

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

Each time the Flutter app calls a streaming method, a new `Session` is created, and a call with that `Session` is made to the method endpoint on the server. The `Session` is automatically closed when the streaming method call is over.

If the web socket connection is lost, all streaming methods are closed on the server and the Flutter app.

When the streaming method is defined with a returning `Stream`, the method is kept alive until the stream subscription is canceled on the Flutter app or the method returns.

When the streaming method returns a `Future`, the method is kept alive until the method returns.

Streams in parameters are closed when the stream is closed. This can be done by either closing the stream on the Flutter app or canceling the subscription on the server.

All streams in parameters are closed when the method call is over.

### Authentication

Authentication is seamlessly integrated into streaming method calls. When a Flutter app initiates a streaming method, the server automatically authenticates the session.

Authentication is validated when the stream is first established, utilizing the authentication data stored in the `Session` object. If a user's authentication is subsequently revoked—requiring denial of access to the stream—the stream will be promptly closed, and an exception will be thrown.

For more details on handling revoked authentication, refer to the section on [handling revoked authentication](authentication/custom-overrides#handling-revoked-authentication).

### WebSocket ping interval

The server sends periodic ping messages on open streaming connections to keep them alive. The interval between pings is configurable and defaults to 30 seconds.

If you deploy behind a load balancer or proxy with a shorter idle timeout (for example, 15-20 seconds), you may need to lower the ping interval so connections are not closed. Set the `SERVERPOD_WEBSOCKET_PING_INTERVAL` environment variable to the desired interval in seconds, or configure `websocketPingInterval` in your [configuration](./configuration) file.

### Error handling

Error handling works just like in regular endpoint methods in Serverpod. If an exception is thrown on a stream, the stream is closed with an exception. If the exception thrown is a serializable exception, the exception is first serialized and passed over the stream before it is closed.

This is supported in both directions; stream parameters can pass exceptions to the server, and return streams can pass exceptions to the Flutter app.

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
  print('Flutter app received error: $error');
});

inStream.addError(SerializableException('Error from Flutter app'));

// This will print
// Server received error: Error from Flutter app 
// Flutter app received error: Error from server 
```

In the example above, the Flutter app sends an error to the server, which then throws an exception back to the Flutter app. And since the exception is serializable, it is passed over the stream before the stream is closed.

Read more about serializable exceptions here: [Serializable exceptions](exceptions).

## Streaming Endpoints (Deprecated)

:::warning
Streaming Endpoints are deprecated and will be removed in a future version of Serverpod. Use [Streaming Methods](#streaming-methods) instead for a simpler and more robust streaming experience.
:::

Streaming endpoints were Serverpod's first attempt at streaming data. This approach is more manual, requiring developers to manage the WebSocket connection to the server.

### Handling streams server-side

The Endpoint class has three methods you override to work with streams.

- `streamOpened` is called when a user connects to a stream on the Endpoint.
- `streamClosed` is called when a user disconnects from a stream on the Endpoint.
- `handleStreamMessage` is called when a serialized message is received from a Flutter app.

To send a message to a Flutter app, call the `sendStreamMessage` method. You will need to include the session associated with the user.

#### The user object

It's often handy to associate a state together with a streaming session. Typically, you do this when a stream is opened.

```dart
Future<void> streamOpened(StreamingSession session) async {
  setUserObject(session, MyUserObject());
}
```

You can access the user object at any time by calling the `getUserObject` method. The user object is automatically discarded when a session ends.

### Handling streams in your app

Before you can access streams in your Flutter app, you need to connect to the server's web socket. You do this by calling connectWebSocket on your client.

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
