# Error handling and exceptions

Handling errors well is essential when you are building your server. To simplify things, Serverpod allows you to throw an exception on the server, serialize it, and catch it in your client app.

If you throw a normal exception that isn't caught by your code, it will be treated as an internal server error. The exception will be logged together with its stack trace, and a 500 HTTP status (internal server error) will be sent to the client. On the client side, this will throw a non-specific ServerpodException, which provides no more data than a session id number which can help identifiy the call in your logs.

:::tip

Use the Serverpod Insights app to view your logs. It will show any failed or slow calls and will make it easy to pinpoint any errors in your server.

:::

## Serializable exceptions

Serverpod allows adding data to an exception you throw on the server and extracting that data in the client. This is useful for passing error messages back to the client when a call fails. You use the same yaml-files to define the serializable exceptions as you would with any serializable model (see [serialization](serialization) for details). The only difference is that you use the keyword `exception` instead of `class`.

```yaml
exception: MyException
fields:
  message: String
  errorType: MyEnum
```

After you run `serverpod generate`, you can throw that exception when processing a call to the server.

```dart
class ExampleEndpoint extends Endpoint {
  Future<void> doThingy(Session session) {
    // ... do stuff ...
    if (failure) {
      throw MyException(
        message: 'Failed to do thingy',
        errorType: MyEnum.thingyError,
      );
    }
  }
}
```

In your app, catch the exception as you would catch any exception.

```dart
try {
  client.example.doThingy();
}
on MyException catch(e) {
  print(e.message);
}
catch(e) {
  print('Something else went wrong.');
}
```

### Default Values in Exceptions

Serverpod allows you to specify default values for fields in exceptions, similar to how it's done in models using the `default` and `defaultModel` keywords. If you're unfamiliar with how these keywords work, you can refer to the [Default Values](models#default-values) section in the [Working with Models](models) documentation.

:::info
Since exceptions are not persisted in the database, the `defaultPersist` keyword is not supported. If both `default` and `defaultModel` are specified, `defaultModel` will always take precedence, making it unnecessary to use both.
:::

**Example:**

```yaml
exception: MyException
fields:
  message: String, default="An error occurred"
  errorCode: int, default=1001
```

In this example:

- The `message` field will default to `"An error occurred"` if not provided.
- The `errorCode` field will default to `1001`.
