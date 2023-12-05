# Sessions

The `Session` object provides information about the current context in a method call in Serverpod. It provides access to the database, caching, authentication, data storage, and messaging within the server. It will also contain information about the HTTP request object.

If you need additional information about a call, you may need to cast the Session to one of its subclasses, e.g., `MethodCallSession` or `StreamingSession`. The `MethodCallSession` object provides additional properties, such as the name of the endpoint and method and the underlying HttpRequest object.

:::tip

You can use the Session object to access the IP address of the client calling a method. Serverpod includes an extension on HttpRequest that allows you to access the IP address even if your server is running behind a load balancer.

```dart
session as MethodCallSession;
var ipAddress = session.httpRequest.remoteIpAddress;
```

:::

## Creating sessions

In most cases, Serverpod manages the life cycle of the Session objects for you. A session is created for a call or a streaming connection and is disposed of when the call has been completed. In rare cases, you may want to create a session manually. For instance, if you are making a database call outside the scope of a method or a future call. In these cases, you can create a new session with the `createSession` method of the `Serverpod` singleton. You can access the singleton by calling `Serverpod.instance`. If you create a new session, you are also responsible for closing it using the `session.close()` method. It's not recommended to keep a session open indefinitely as it can lead to memory leaks, as the session stores logs until it is closed.
