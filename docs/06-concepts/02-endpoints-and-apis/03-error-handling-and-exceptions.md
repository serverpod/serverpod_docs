---
description: Errors in Serverpod cross the wire as serializable exceptions defined in model files, caught by type in the app alongside typed HTTP failures.
---

# Error handling and exceptions

Errors on the server reach your app as typed Dart exceptions. You define an exception once, throw it on the server, and catch it by type in your Flutter app. Failures carry structured data instead of strings.

If you throw a normal exception that isn't caught by your code, it will be treated as an internal server error. The exception will be logged together with its stack trace, and a 500 HTTP status (internal server error) will be sent to the client. On the client side, this throws a `ServerpodClientException` with status code 500 (specifically `ServerpodClientInternalServerError`). The error message and stack trace stay on the server, logged to the `serverpod_session_log` table.

:::info
Session logs live in `serverpod_session_log`, not `serverpod_log`; see [logging](../operations/logging) for the difference. The Serverpod Insights app shows failed and slow calls.
:::

## Serializable exceptions

Serverpod allows adding data to an exception you throw on the server and extracting that data in the client. You define them in the same model files as any serializable model (see [Working with models](../data-and-the-database/models) for how model files work). The only difference is that you use the keyword `exception` instead of `class`.

```yaml
exception: MyException
fields:
  message: String
  errorType: MyEnum
```

Once the code is generated, you can throw that exception when processing a call to the server.

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

### Group exceptions in a hierarchy

Use `extends` to share fields and handling across related serializable exceptions. Add `sealed: true` to the root when all concrete cases are known and clients should handle them exhaustively.

Define each exception in its own model file. For example, start with a sealed base exception:

```yaml
# api_exception.spy.yaml
exception: ApiException
sealed: true
fields:
  message: String
```

Then extend it with the concrete failures your endpoint can throw:

```yaml
# not_found_exception.spy.yaml
exception: NotFoundException
extends: ApiException
fields:
  resource: String
```

```yaml
# validation_exception.spy.yaml
exception: ValidationException
extends: ApiException
fields:
  field: String
```

After running `serverpod generate`, throw the concrete exceptions from an endpoint:

```dart
class UserEndpoint extends Endpoint {
  Future<void> updateName(
    Session session, {
    required int userId,
    required String name,
  }) async {
    if (name.trim().isEmpty) {
      throw ValidationException(
        message: 'Enter a name.',
        field: 'name',
      );
    }

    var user = await User.db.findById(session, userId);
    if (user == null) {
      throw NotFoundException(
        message: 'The user was not found.',
        resource: 'user',
      );
    }

    await User.db.updateRow(session, user.copyWith(name: name));
  }
}
```

On the client, catch the base type and use an exhaustive switch over its concrete subtypes:

```dart
try {
  await client.user.updateName(userId: userId, name: name);
} on ApiException catch (error) {
  var message = switch (error) {
    NotFoundException(:final resource) => '$resource was not found.',
    ValidationException(:final field) => 'Check the $field field.',
  };

  showError(message);
}
```

The Dart analyzer requires every subtype of the sealed exception to be covered. This makes adding another concrete exception an explicit client change instead of silently falling through a general catch.

Exception hierarchies can be defined in a [shared package](../data-and-the-database/models/shared-packages) when several Serverpod projects need the same wire types. Keep every subtype of a sealed shared exception in that same shared package. A consuming project cannot add another subtype to a sealed exception from a different package.

An exception can only extend another exception, and a regular model class can only extend another regular model class. Serverpod reports a model validation error if a hierarchy mixes the two kinds.

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

Serverpod allows you to specify default values for fields in exceptions, similar to models: `default` sets the value when the field is omitted, and `defaultModel` sets it on the Dart side. See [default values](../data-and-the-database/models#default-values) in Working with models.

:::info
Since exceptions are not persisted in the database, the `defaultPersist` keyword is not supported. If both `default` and `defaultModel` are specified, `defaultModel` takes precedence.
:::

```yaml
exception: MyException
fields:
  message: String, default="An error occurred"
  errorCode: int, default=1001
```

## Handle errors in your app

A call from the client can fail in three ways, and you usually handle each one differently:

- A **serializable exception you defined** (`MyException` above): a known, app-level failure. Catch it by its type and show the user what happened. (On the wire, it travels as an HTTP 400 with a typed payload.)
- A **`ServerpodClientException`**: something went wrong in the communication or on the server. Its typed subclasses map to HTTP status codes: `ServerpodClientBadRequest` (400), `ServerpodClientUnauthorized` (401), `ServerpodClientForbidden` (403), `ServerpodClientNotFound` (404), and `ServerpodClientInternalServerError` (500).
- A **connection failure**: when the app cannot reach the server (offline, wrong URL, or a timeout), it throws a `ServerpodClientException` with a `statusCode` of `-1`. A call that exceeds the [request size limit](../endpoints-and-apis#pass-and-return-data) fails with a generic `ServerpodClientException` with status code 413.

Calls to [streaming methods](./streaming) fail with their own connection-level exception family; see [error handling in streams](./streaming#error-handling).

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

- Don't put stack traces, secrets, database IDs, or internal messages into serializable exception fields. Send only what the user should see.
- Write user-facing messages, and keep the diagnostic detail in your server logs where you can look it up later.
- Validate and sanitize input before acting on it, so a bad request fails cleanly instead of surfacing an internal error.
