# Serialization
Serverpod makes it easy to generate serializable classes that can be passed between server and client or used to communicate with the database.

## Serverpod's native serialization
The structure for your serialized classes is defined in YAML-files in the `protocol` directory. Run `serverpod generate` to build the Dart code for the classes and make them accessible to both the server and client.

Here is a simple example of a YAML-file defining a serializable class:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>
```

Supported types are `bool`, `int`, `double`, `String`, `DateTime`, `ByteData`, and other serializable classes. You can also use `List`s and `Map`s of the supported types, just make sure to specify the types. Null safety is supported. The keys of `Map` must be non-nullable `String`s. Once your classes are generated, you can use them as parameters or return types to endpoint methods.

### Extending the generated classes
Sometimes you will want to add custom methods to the generated classes. The easiest way to do this is with Dart's extension feature.

### Limiting visibility of a generated class
By default, generated code for your serializable objects is available both on the server and the client. You may want to have the code on the server side only. E.g., if the serializable object is connected to a database table containing private information.

To make a serializable class generated only on the server side, set the `serverOnly` property to `true`.

```yaml
class: MyPrivateClass
serverOnly: true
fields:
  hiddenSecretKey: String
```

### Adding documentation
Serverpod allows you to add documentation to your serializable objects in a similar way that you would add documentation to your Dart code. Use three hashes (`###`) to indicate that a comment should be considered documentation.

```yaml
### Information about a company.
class: Company
fields:
  ### The name of the company.
  name: String

  ### The date the company was founded, if known.
  foundedDate: DateTime?

  ### A list of people currently employed at the company.
  employees: List<Employee>
```

:::info

Serverpod's serializable objects can easily be saved to or read from the database. You can read more about this in the next section, [Database communication](./database-communication).

:::

## Custom serializable objects
For most purposes, you will want to use Serverpod's native serialization as described above. However, there may be cases where you want to serialize more advanced objects. With Serverpod, you can pass any serializable objects as long as they conform to two simple rules:

1. Your objects must have a method called toJson() which returns a JSON serialization of the object.
2. There must be a constructor or factory called fromJson(), which takes a JSON serialization and a Serialization manager as parameters.
3. You must declare your custom serializable objects in the config/generator.yaml file.

Typically, you will want to place your serializable objects in a shared package between the client and your server. For instance, if you use Freezed to do your serialization, the class would look something like this:

```dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:serverpod_serialization/serverpod_serialization.dart';

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
    SerializationManager serializationManager,
  ) =>
      _$FreezedCustomClassFromJson(json);
}
```

In the config/generator.yaml, you declare the package and the class:

```yaml
extraClasses:
  - package:my_shared_package/my_shared_package.dart:FreezedCustomClass
```

After adding a new serializable class, you must run `serverpod generate`.
