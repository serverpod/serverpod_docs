---
description: Stream data between server and client in Serverpod using streaming methods over a self-managed WebSocket connection, with support for bidirectional streams and serializable exceptions.
---

# Streams

For some applications, it's not enough to be able to call server-side methods. You may also want to push data from the server to the client or send data two-way. Examples include real-time games or chat applications. Luckily, Serverpod supports a framework for streaming data. It's possible to stream any serialized objects to or from any endpoint.

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

The stream is defined as dynamic and can contain any type that can be serialized by Serverpod.

:::

### Lifecycle of a streaming method

Each time the client calls a streaming method, a new `Session` is created, and a call with that `Session` is made to the method endpoint on the server. The `Session` is automatically closed when the streaming method call is over.

If the web socket connection is lost, all streaming methods are closed on the server and the client.

When the streaming method is defined with a returning `Stream`, the method is kept alive until the stream subscription is canceled on the client or the method returns.

When the streaming method returns a `Future`, the method is kept alive until the method returns.

Streams in parameters are closed when the stream is closed. This can be done by either closing the stream on the client or canceling the subscription on the server.

All streams in parameters are closed when the method call is over.

### Authentication

Authentication is integrated into streaming method calls. When a client initiates a streaming method, the server automatically authenticates the session.

Authentication is validated when the stream is first established, using the authentication data stored in the `Session` object. If a user's authentication is revoked, the stream is closed and an exception is thrown.

For more details on handling revoked authentication, refer to the section on [handling revoked authentication](../authentication/custom-overrides#handling-revoked-authentication).

### WebSocket ping interval

The server sends periodic ping messages on open streaming connections to keep them alive. The interval between pings is configurable and defaults to 30 seconds.

If you deploy behind a load balancer or proxy with a shorter idle timeout (for example, 15-20 seconds), you may need to lower the ping interval so connections are not closed. Set the `SERVERPOD_WEBSOCKET_PING_INTERVAL` environment variable to the desired interval in seconds, or configure `websocketPingInterval` in your config file; see the [Configuration reference](../lookups/configuration-reference).

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

Read more about serializable exceptions here: [Serializable exceptions](./error-handling-and-exceptions).

## Example: live updates for a filtered query

A common real-time need is to push updates for one record or filter, for example the messages in a single chat room. Combine a streaming method with [server events](./server-events): the streaming method subscribes the client to a channel scoped to that filter, and whatever changes the data posts to the same channel.

```dart
class ChatEndpoint extends Endpoint {
  // The client subscribes to live messages for one room.
  Stream<ChatMessage> watchRoom(Session session, int roomId) async* {
    yield* session.messages.createStream<ChatMessage>('room_$roomId');
  }

  // Posting a message stores it and broadcasts it to everyone watching the room.
  Future<void> postToRoom(Session session, int roomId, String text) async {
    var message = ChatMessage(roomId: roomId, text: text);
    await ChatMessage.db.insertRow(session, message);
    await session.messages.postMessage('room_$roomId', message);
  }
}
```

On the client, listen to the returned stream and call `postToRoom` to publish:

```dart
var messages = client.chat.watchRoom(roomId);
messages.listen((message) {
  print('Room ${message.roomId}: ${message.text}');
});

await client.chat.postToRoom(roomId, 'Hello, room!');
```

Because the channel name includes the `roomId`, each client receives updates only for the room it is watching. The same pattern works for any filter: scope the channel by the id or query you care about, and post to it whenever the data changes. To fan the updates out across multiple server instances, post with `global: true` (see [Global messages](./server-events#global-messages)).

## Streaming endpoints (deprecated)

Serverpod's original streaming API (`streamOpened`, `handleStreamMessage`, `sendStreamMessage`, `openStreamingConnection`) is deprecated and will be removed in a future version. Use [streaming methods](#streaming-methods) instead. The old API is kept for reference in [Streaming endpoints (deprecated)](../../upgrading/archive/streaming-endpoints).
