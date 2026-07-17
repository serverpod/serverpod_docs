---
description: Server events in Serverpod post messages to named channels through session.messages, delivered locally or across a cluster via Redis.
---

# Server events

Serverpod has a built-in event system: post a message to a named channel, and every listener on that channel receives it, even on other servers in a cluster. It is how one user's action reaches everyone else, like the chat-room updates in [streaming's live example](./streaming#example-live-updates-for-a-filtered-query). You access it through `session.messages`.

## Send messages

Send a message with the `postMessage` method. The message is published to the specified channel and must be a [data model](../data-and-the-database/models).

```dart
var message = UserUpdate(); // Model that represents changes to user data.
await session.messages.postMessage('user_updates', message);
```

In the example above, the message is published on the `user_updates` channel. Any subscriber to this channel in the server will receive the message.

### Global messages

Serverpod uses Redis to pass messages between servers. To send a message to another server, [enable Redis](../server-fundamentals/configuration) and then set the `global` parameter to `true` when posting a message.

```dart
var message = UserUpdate(); // Model that represents changes to user data.
await session.messages.postMessage('user_updates', message, global: true);
```

In the example above, the message is published to the `user_updates` channel and will be received by all servers connected to the same Redis instance.

:::warning

If Redis is not enabled, sending global messages throws a `StateError`.

:::

## Receive messages

Serverpod provides two ways to handle incoming messages: by creating a stream that subscribes to a channel or by adding a listener to a channel.

### Create a stream

To create a stream that subscribes to a channel, use the `createStream` method. The stream emits a value whenever a message is posted to the channel. The typed variant, `createStream<UserUpdate>(...)`, emits an error if a posted message does not match the type.

```dart
var stream = session.messages.createStream('user_updates');
stream.listen((message) {
  print('Received message: $message');
});
```

In the above example, a stream is created that listens to the `user_updates` channel and processes incoming messages.

#### Stream lifecycle

The stream is automatically closed when the session is closed. To close the stream manually, cancel the stream subscription.

```dart
var stream = session.messages.createStream('user_updates');
var subscription = stream.listen((message) {
    print('Received message: $message');
});

subscription.cancel();
```

### Add a listener

To add a listener to a channel, use the `addListener` method. The listener will be called whenever a message is posted to the channel.

```dart
session.messages.addListener('user_updates', (message) {
  print('Received message: $message');
});
```

In the above example, the listener will be called whenever a message is posted to the `user_updates` channel. Listeners receive both local and global messages.

#### Listener lifecycle

The listener is automatically removed when the session is closed. To manually remove a listener, use the `removeListener` method.

```dart
var myListenerCallback = (message) {
  print('Received message: $message');
};
// Register the listener
session.messages.addListener('user_updates', myListenerCallback);

// Remove the listener
session.messages.removeListener('user_updates', myListenerCallback);
```

In the above example, the listener is first added and then removed from the `user_updates` channel.

## Broadcast revoked authentication

The messaging interface also carries authentication revocation events: `session.messages.authenticationRevoked(userIdentifier, message)` notifies every server that a user's authentication changed, falling back to local delivery when Redis is disabled. For when and how to call it, see [handling revoked authentication](../authentication/custom-overrides#handling-revoked-authentication).
