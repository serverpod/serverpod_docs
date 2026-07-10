---
description: Handle server errors in Serverpod by defining serializable exceptions that are thrown on the server and caught in your Flutter app.
---

# Error handling and exceptions

Serverpod allows you to throw an exception on the server, serialize it, and catch it in your client app.

If you throw a normal exception that isn't caught by your code, it will be treated as an internal server error. The exception will be logged together with its stack trace, and a 500 HTTP status (internal server error) will be sent to the client. On the client side, this throws a `ServerpodClientException` with status code 500 (specifically `ServerpodClientInternalServerError`). The error message and stack trace stay on the server, logged to the `serverpod_session_log` table.

:::tip
Use the Serverpod Insights app to view your logs. It will show any failed or slow calls and will make it easy to pinpoint any errors in your server.
:::

:::info
Uncaught exceptions thrown in endpoints are logged in the `serverpod_session_log` table, not in the `serverpod_log` table. To understand more about the differences between these two tables, you can read more about [logging](../operations/logging) in Serverpod.
:::

## Serializable exceptions

Serverpod allows adding data to an exception you throw on the server and extracting that data in the client. You use the same YAML files to define the serializable exceptions as you would with any serializable model (see [serialization](../data-and-the-database/models/custom-serialization) for details). The only difference is that you use the keyword `exception` instead of `class`.

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
  await client.example.doThingy();
}
on MyException catch(e) {
  print(e.message);
}
catch(e) {
  print('Something else went wrong.');
}
```

### Custom serializable exception classes

If you already have a Dart exception class in a package shared by the server and client, the class must implement `SerializableException` for Serverpod to send it to the client. Otherwise, Serverpod treats the exception as an internal server error.

```dart
import 'package:serverpod_serialization/serverpod_serialization.dart';

class UserFacingException implements SerializableException {
  final String message;
  final String? code;

  UserFacingException({
    required this.message,
    this.code,
  });

  factory UserFacingException.fromJson(Map<String, dynamic> json) {
    return UserFacingException(
      message: json['message'] as String,
      code: json['code'] as String?,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'code': code,
    };
  }

  @override
  String toString() => message;
}
```

The class must also be known to Serverpod's generated serialization manager. Register it in the server project's `config/generator.yaml`, then run `serverpod generate`:

```yaml
extraClasses:
  - package:my_project_shared/my_project_shared.dart:UserFacingException
```

The `SerializableException` interface marks the exception as safe to serialize to the client. See [Custom serializable classes](../server-fundamentals/configuration#custom-serializable-classes) for how the `extraClasses` entry registers the type for code generation.

### Default values in exceptions

Serverpod allows you to specify default values for fields in exceptions, similar to how it's done in models using the `default` and `defaultModel` keywords. If you're unfamiliar with how these keywords work, you can refer to the [Default Values](../data-and-the-database/models#default-values) section in the [Working with Models](../data-and-the-database/models) documentation.

:::info
Since exceptions are not persisted in the database, the `defaultPersist` keyword is not supported. If both `default` and `defaultModel` are specified, `defaultModel` will always take precedence, making it unnecessary to use both.
:::

```yaml
exception: MyException
fields:
  message: String, default="An error occurred"
  errorCode: int, default=1001
```

## Handling errors on the client

A call from the client can fail in three ways, and you usually handle each one differently:

- A **serializable exception you defined** (`MyException` above): a known, app-level failure. Catch it by its type and show the reader what happened.
- A **`ServerpodClientException`**: something went wrong in the communication or on the server. Its typed subclasses map to HTTP status codes: `ServerpodClientBadRequest` (400), `ServerpodClientUnauthorized` (401), `ServerpodClientForbidden` (403), `ServerpodClientNotFound` (404), and `ServerpodClientInternalServerError` (500).
- A **connection failure**: when the app cannot reach the server (offline, wrong URL, or a timeout), it throws a `ServerpodClientException` with a `statusCode` of `-1`.

Catch the specific cases first, then fall back to the general one:

```dart
try {
  await client.example.doThingy();
} on MyException catch (e) {
  // A failure you defined and threw on the server.
  showError(e.message);
} on ServerpodClientUnauthorized catch (_) {
  // The call requires the user to sign in.
  redirectToSignIn();
} on ServerpodClientException catch (e) {
  if (e.statusCode == -1) {
    // Could not reach the server.
    showError('Cannot reach the server. Check your connection and try again.');
  } else {
    // The server returned an error, for example a 500.
    showError('Something went wrong. Please try again.');
  }
}
```

## Don't leak sensitive data

Only the serializable exceptions you define reach the client, and every field on them is sent as-is. An uncaught exception becomes a generic 500 with no details, so internal errors never leak on their own. The risk is what you put on the exceptions you do send.

- Don't put stack traces, secrets, database IDs, or internal messages into serializable exception fields. Send only what the reader should see.
- Write user-facing messages, and keep the diagnostic detail in your server logs where you can look it up later.
- Validate and sanitize input before acting on it, so a bad request fails cleanly instead of surfacing an internal error.
