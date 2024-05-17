# Streams and messaging

For some applications, it's not enough to be able to call server-side methods. You may also want to push data from the server to the client or send data two-way. Examples include real-time games or chat applications. Luckily, Serverpod supports a framework for streaming data. It's possible to stream any serialized objects to or from any endpoint.

## Handling streams server-side

The Endpoint class has three methods you override to work with streams.

- `streamOpened` is called when a user connects to a stream on the Endpoint.
- `streamClosed` is called when a user disconnects from a stream on the Endpoint.
- `handleStreamMessage` is called when a serialized message is received from a client.

To send a message to a client, call the `sendStreamMessage` method. You will need to include the session associated with the user.

### The user object

It's often handy to associate a state together with a streaming session. Typically, you do this when a stream is opened.

```dart
Future<void> streamOpened(StreamingSession session) async {
  setUserObject(session, MyUserObject());
}
```

You can access the user object at any time by calling the `getUserObject` method. The user object is automatically discarded when a session ends.

### Internal server messaging

A typical scenario when working with streams is to pass on messages from one user to another. For instance, if one client sends a chat message to the server, the server should send it to the correct user. Serverpod comes with a built-in messaging system that makes this easy. You can pass messages locally on a single server, but messages are passed through Redis by default. Passing the messages through Redis makes it possible to send the messages between multiple servers in a cluster.

In most cases, it's easiest to subscribe to a message channel in the `streamOpened` method. The subscription will automatically be disposed of when the stream is closed. The following example will forward any message sent to a user identified by its user id.

```dart
@override
Future<void> streamOpened(StreamingSession session) async {
  session.messages.addListener(
    'user_${await session.auth.authenticatedUserId}',
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
  SerializableEntity message,
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

## Handling streams in your app

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
