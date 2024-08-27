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

Serverpod supports the use of default values for fields in exceptions, just like it does for models. This feature allows you to define default values for any supported field type directly within your exception definitions.

#### How to Define Default Values

To define a default value for a field in an exception, simply specify the `default` or `defaultModel` keywords, just as you would in a model.

**Example:**

```yaml
exception: MyException
fields:
  message: String, default="An error occurred"
  errorCode: int, default=1001
```

In the example above:

- The `message` field will default to `"An error occurred"` if not provided.
- The `errorCode` field will default to `1001`.

#### Important Note

Since exceptions are never persisted to the database, we do not support `defaultPersist` for exception fields. This means that only `default` and `defaultModel` are relevant in this context.

However, it’s important to note that `defaultModel` will override `default` if both are specified. Since exceptions only exist in the model (Dart code) and are not persisted, using `defaultModel` in combination with `default` is redundant. The `defaultModel` value will always take precedence over `default`, making it unnecessary to use both in conjunction.

#### Learn More

For a complete explanation of how default values work, including the supported types and the behavior of the `default` and `defaultModel` keywords, please refer to the [Default Values](models#default-values) section in the [Working with Models](models) documentation.
