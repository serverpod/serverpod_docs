---
description: The deprecated streaming endpoints API (streamOpened, handleStreamMessage, sendStreamMessage, openStreamingConnection). Use streaming methods instead.
---

# Streaming endpoints (deprecated)

:::warning
Streaming endpoints are deprecated and will be removed in a future version of Serverpod. Use [streaming methods](../../concepts/streams#streaming-methods) instead for a simpler and more reliable streaming experience. This page is kept for projects still on the old API.
:::

Streaming endpoints were Serverpod's first attempt at streaming data. This approach is more manual, requiring you to manage the WebSocket connection to the server.

## Handling streams server-side

The Endpoint class has three methods you override to work with streams.

- `streamOpened` is called when a user connects to a stream on the Endpoint.
- `streamClosed` is called when a user disconnects from a stream on the Endpoint.
- `handleStreamMessage` is called when a serialized message is received from a client.

To send a message to a client, call the `sendStreamMessage` method. You will need to include the session associated with the user.

### The user object

Associate state with a streaming session by setting a user object when the stream is opened.

```dart
Future<void> streamOpened(StreamingSession session) async {
  setUserObject(session, MyUserObject());
}
```

You can access the user object at any time by calling the `getUserObject` method. The user object is automatically discarded when a session ends.

## Handling streams in your app

Before you can access streams in your client, you need to connect to the server's web socket by calling `openStreamingConnection` on your client.

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
