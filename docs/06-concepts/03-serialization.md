---
sidebar_label: Custom serialization
description: Pass custom classes through Serverpod endpoints and models with toJson/fromJson, Freezed support, and ProtocolSerialization for server-only fields.
---

# Custom serialization

For most purposes, you will want to use Serverpod's native serialization. However, there may be cases where you want to serialize more advanced objects. With Serverpod, you can pass any serializable objects as long as they conform to the following rules:

1. Your objects must have a method called `toJson()` which returns a JSON serialization of the object.

   ```dart
   Map<String, dynamic> toJson() {
     return {
       'name': 'John Doe',
     };
   }
   ```

2. There must be a constructor or factory called `fromJson()`, which takes a JSON serialization as parameters.

   ```dart
   factory ClassName.fromJson(
     Map<String, dynamic> json,
   ) {
     return ClassName(
       name: json['name'] as String,
     );
   }
   ```

3. You must declare your custom serializable objects in the `config/generator.yaml` file in the server project, the path needs to be accessible from both the server package and the client package.

   ```yaml

   ...
   extraClasses:
     - package:my_project_shared/my_project_shared.dart:ClassName
   ```

## Using a custom class as a model field

If your custom class will be used as a field inside a generated `.spy.yaml` model, also implement a `copyWith()` method. The parent model's generated `copyWith` calls `.copyWith()` on each field to produce a deep copy. `copyWith()` is not needed when the class is only used as an endpoint parameter or return type.

```dart
ClassName copyWith({
  String? name,
}) {
  return ClassName(
    name: name ?? this.name,
  );
}
```

:::tip
In the framework, `copyWith()` is implemented as a deep copy to ensure immutability. We recommend following this approach when implementing it for custom classes to avoid unintentional side effects caused by shared mutable references.
:::

## Setup example

We recommend creating a new dart package specifically for sharing these types of classes and importing it into the server and client `pubspec.yaml`. This can easily be done by running `$ dart create -t package <my_project>_shared` in the root folder of your project.

Your folder structure should then look like this:

```text
├── my_project_client
├── my_project_flutter
├── my_project_server
├── my_project_shared
```

Then you need to update both your `my_project_server/pubspec.yaml` and `my_project_client/pubspec.yaml` and add the new package as a dependency.

```yaml
dependencies:
  ...
  my_project_shared:
    path: ../my_project_shared
  ...
```

Now you can create your custom class in your new shared package:

```dart
class ClassName {
  String name;
  ClassName(this.name);

  Map<String, dynamic> toJson() {
    return {
      'name': name,
    };
  }

  factory ClassName.fromJson(
    Map<String, dynamic> jsonSerialization,
  ) {
    return ClassName(
      jsonSerialization['name'],
    );
  }
}
```

After adding a new serializable class, you must run `serverpod generate`. You are now able to use this class in your endpoints with the full serialization and deserialization management that comes with Serverpod.

In your server project, you can create an endpoint returning your custom object.

```dart
import 'package:my_project_shared/my_project_shared.dart';
import 'package:serverpod/serverpod.dart';

class ExampleEndpoint extends Endpoint {
  Future<ClassName> getMyCustomClass(Session session) async {
    return ClassName(
      'John Doe',
    );
  }
}
```

## Custom class with Freezed

Serverpod also has support for using custom classes created with the [Freezed](https://pub.dev/packages/freezed) package.

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'freezed_custom_class.freezed.dart';
part 'freezed_custom_class.g.dart';

@freezed
class FreezedCustomClass with _$FreezedCustomClass {
  const factory FreezedCustomClass({
    required String firstName,
    required String lastName,
    required int age,
  }) = _FreezedCustomClass;

  factory FreezedCustomClass.fromJson(
    Map<String, Object?> json,
  ) =>
      _$FreezedCustomClassFromJson(json);
}
```

In the config/generator.yaml, you declare the package and the class:

```yaml
extraClasses:
  - package:my_shared_package/my_shared_package.dart:FreezedCustomClass
```

## Custom class with ProtocolSerialization

If you need certain fields to be omitted when transmitting to the client-side, your server-side custom class should implement the `ProtocolSerialization` interface. This requires adding a method named `toJsonForProtocol()`. Serverpod will then use this method to serialize your object for protocol communication. If the class does not implement `ProtocolSerialization`, Serverpod defaults to using the `toJson()` method.

### Implementation example

Here’s how you can implement it:

```dart
class CustomClass implements ProtocolSerialization {
  final String? value;
  final String? serverSideValue;

  CustomClass({this.value, this.serverSideValue});

  // Serializes fields specifically for protocol communication
  Map<String, dynamic> toJsonForProtocol() {
    return {
      "value":value,
    };
  }

  // Serializes all fields, including those intended only for server-side use
  Map<String, dynamic> toJson() {
    return {
      "value": value,
      "serverSideValue": serverSideValue,
    };
  }
}
```

This structure ensures that sensitive or server-only data is not exposed to the client, enhancing security and data integrity.

Importantly, this implementation is not required for client-side custom models.
