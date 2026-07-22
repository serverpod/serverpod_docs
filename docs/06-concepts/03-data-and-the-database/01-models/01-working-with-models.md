---
slug: /concepts/data-and-the-database/models
sidebar_label: Working with models
description: Serverpod model files define serializable classes, exceptions, and enums, with fields, defaults, visibility, and generated Dart code.
---

# Working with models

A data model is a YAML definition that becomes a typed Dart class on both the server and the client, and, with a [table](./database/tables) key, a database table as well. Models are the unit of data your endpoints pass and your database stores.

The recommended file extension is `.spy.yaml` (.spy stands for "Serverpod YAML"), with `.spy` and `.spy.yml` accepted as well. These files can be placed anywhere in your server's `lib` directory, and the extension enables syntax highlighting through the [Serverpod Extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod) for VS Code. Regular `.yaml` files are also supported, but only within `lib/src/models` (or the legacy `lib/src/protocol` directory).

The Serverpod CLI reads the model files when generating code and creating migrations. With `serverpod start` running, saving a model file regenerates the code. Outside a session, run `serverpod generate`.

This page covers the model file format: classes, exceptions, enums, default values, and the generated Dart code. The other pages in this group build on it:

- [Inheritance and polymorphism](./models/inheritance-and-polymorphism): share fields between models with `extends` and `sealed`, and use parent types in endpoints.
- [Custom serialization](./models/custom-serialization): pass hand-written Dart classes through endpoints and models.
- [Shared packages](./models/shared-packages): define models in a package that both the server and the app depend on.

## Class

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>
```

### Supported types

The following types can be used as field types:

- **Core Dart types**: [bool](https://api.dart.dev/dart-core/bool-class.html), [int](https://api.dart.dev/dart-core/int-class.html), [double](https://api.dart.dev/dart-core/double-class.html), [String](https://api.dart.dev/dart-core/String-class.html), [Duration](https://api.dart.dev/dart-core/Duration-class.html), [DateTime](https://api.dart.dev/dart-core/DateTime-class.html), [ByteData](https://api.dart.dev/dart-typed_data/ByteData-class.html), [UuidValue](https://pub.dev/documentation/uuid/latest/uuid_value/UuidValue-class.html), [Uri](https://api.dart.dev/dart-core/Uri-class.html), and [BigInt](https://api.dart.dev/dart-core/BigInt-class.html).
- **Vector types**: [Vector](./database/vector-and-geography-fields#vector), [HalfVector](./database/vector-and-geography-fields#halfvector), [SparseVector](./database/vector-and-geography-fields#sparsevector), and [Bit](./database/vector-and-geography-fields#bit).
- **Geography types**: [GeographyPoint](./database/vector-and-geography-fields#geographypoint), [GeographyLineString](./database/vector-and-geography-fields#geographylinestring), [GeographyPolygon](./database/vector-and-geography-fields#geographypolygon), and [GeographyGeometryCollection](./database/vector-and-geography-fields#geographygeometrycollection).
- **Your own types**: other serializable [classes](#class), [exceptions](#exception), and [enums](#enum).
- **Collections**: [List](https://api.dart.dev/dart-core/List-class.html)s, [Map](https://api.dart.dev/dart-core/Map-class.html)s, and [Set](https://api.dart.dev/dart-core/Set-class.html)s of the supported types, with the type arguments specified. All supported types can also be used inside [Record](https://api.dart.dev/dart-core/Record-class.html)s.
- **dynamic**: holds any serializable value when the type is not known at compile time.

Null safety is supported: append `?` to any type to make the field nullable. Once your classes are generated, you can use them as parameters or return types to [endpoint methods](../endpoints-and-apis).

When values are sent between the server and the client, some types are converted to a specific JSON form:

| Type | Sent as |
| --- | --- |
| `DateTime` | ISO 8601 string, converted to UTC |
| `Duration` | Integer, in milliseconds |
| `ByteData` | Base64-encoded string |
| `UuidValue` | UUID string |
| `Uri` | String |
| `BigInt` | String |

### Required fields

Whether a field is required follows from its nullability. Non-nullable fields are always required constructor parameters. Append `?` to the type, e.g. `String?` or `List<Employee>?`, to make a field optional. The `required` keyword can only be used on nullable fields, and makes the field a required constructor parameter while keeping its type nullable.

```yaml
class: Person
fields:
  name: String              # Required, cannot be null
  nickname: String?, required # Required, but can be set to null
  age: int?                 # Optional
```

In the example above, `name` and `nickname` are both required constructor parameters, and only `nickname` accepts null.

:::tip
Once your app is in users' hands, changing or removing a model's fields can break older app versions. Adding new fields is safe when they are nullable or have a default value. See [backward compatibility](../endpoints-and-apis/backward-compatibility).
:::

### Limiting visibility of a generated class

By default, generated code for your serializable objects is available both on the server and the client. You may want to have the code on the server side only. E.g., if the serializable object is connected to a database table containing private information.

To make a serializable class generated only on the server side, set the serverOnly property to true.

```yaml
class: MyPrivateClass
serverOnly: true
fields:
  hiddenSecretKey: String
```

It is also possible to set a `scope` on a per-field basis. By default all fields are visible to both the server and the client. The available scopes are `all`, `serverOnly`, `none`. A field with a scope other than `all` must be nullable.

:::info
The `none` scope is not typically used in Serverpod apps. It is intended for the Serverpod framework itself.
:::

```yaml
class: SelectivelyHiddenClass
fields:
  hiddenSecretKey: String?, scope=serverOnly
  publicKey: String
```

:::info
Models can be saved to and read from the database. See the [Database](./database/tables) section.
:::

### JSON key aliasing

By default, fields are serialized to JSON using their Dart field name as the key. The `jsonKey` property allows you to specify a different key name for JSON serialization and deserialization, which is useful when integrating with external APIs that use different naming conventions.

```yaml
class: User
fields:
  displayName: String, jsonKey=display_name
  emailAddress: String, jsonKey=email
  createdAt: DateTime, jsonKey=created_at
```

This generates a class where the Dart field names remain camelCase, but the JSON representation uses the specified keys:

```dart
// Dart field names
var user = User(
  displayName: 'John Doe',
  emailAddress: 'john@example.com',
  createdAt: DateTime.parse('2024-01-15T10:30:00.000Z'),
);

// Serializes to JSON with custom keys
// {
//   "display_name": "John Doe",
//   "email": "john@example.com",
//   "created_at": "2024-01-15T10:30:00.000Z"
// }
```

This is particularly helpful when:

- Consuming external APIs that use snake_case or other naming conventions
- Working with legacy systems that have specific JSON field requirements
- Working with databases or services that reserve key names, such as mapping `id` to `_id` for MongoDB

:::info
The `jsonKey` property affects JSON serialization and deserialization. It does not affect the database column name. To customize the database column name, use the [`column` property](./database/tables#column-name-override) instead.
:::

### Immutable classes

By default, generated classes in Serverpod are mutable, meaning their fields can be changed after creation. However, you can make a class immutable by setting the `immutable` property to `true`. Immutable classes are especially useful when working with state management solutions or when you need value-based equality.

```yaml
class: ImmutableUser
immutable: true
fields:
  name: String
  email: String
```

When you mark a class as immutable:

1. **All fields become final**: Fields cannot be reassigned after the object is created
2. **Generates `operator ==`**: Provides deep equality comparison between instances
3. **Generates `hashCode`**: Ensures instances with the same values have the same hash code
4. **Compatible with `copyWith`**: You can still create modified copies of immutable objects using the `copyWith` method

Example usage:

```dart
var user1 = ImmutableUser(name: 'Alice', email: 'alice@example.com');
var user2 = ImmutableUser(name: 'Alice', email: 'alice@example.com');

// Equality comparison works based on values
print(user1 == user2); // true

// Fields are final and cannot be reassigned
// user1.name = 'Bob'; // This would cause a compile error

// Use copyWith to create modified copies
var user3 = user1.copyWith(name: 'Bob');
print(user3.name); // Bob
print(user3.email); // alice@example.com
```

## Default values

Fields can be given default values with three keywords that determine where the default applies:

- **default**: sets the default value for both the model (code) and the database (persisted data). It acts as the fallback when the more specific keywords are absent.
- **defaultModel**: sets the default value for the model only, overriding `default` on the code side.
- **defaultPersist**: sets the default value for the database column only, overriding `default` on the persisted side. It is only meaningful on models with a [table](./database/tables).

You can use the keywords individually or in combination.

:::info
A database default only applies when an insert omits a value for the column. A field with `default` or `defaultModel` always has a value when the row is written, so its `defaultPersist` never fires. `defaultPersist` only comes into play when the model does not provide a value, for example on a nullable field without a model-side default.
:::

### Supported default values

| Type | Allowed values | Example |
| --- | --- | --- |
| `bool` | `true` or `false` | `boolDefault: bool, default=true` |
| `int` | Any integer value | `intDefault: int, default=10` |
| `double` | Any double value | `doubleDefault: double, default=10.5` |
| `String` | Any string value | `stringDefault: String, default='This is a string'` |
| `DateTime` | `now`, or a UTC string in the format `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'` | `dateTimeDefault: DateTime, default=2024-05-01T22:00:00.000Z` |
| `Duration` | A duration in the format `Xd Xh Xmin Xs Xms` | `durationDefault: Duration, default=1d 2h 10min 30s 100ms` |
| `UuidValue` | `random`, `random_v7`, or a UUID string such as `'550e8400-e29b-41d4-a716-446655440000'` | `uuidDefault: UuidValue, default=random` |
| `Uri` | Any valid URI string | `uriDefault: Uri, default='https://serverpod.dev'` |
| `BigInt` | Any integer value, as a string | `bigIntDefault: BigInt, default='1234567890'` |
| Enums | Any of the enum's values | `enumDefault: ByNameEnum, default=byName1` |

For `UuidValue`, `random` generates a UUID v4 (`Uuid().v4obj()` in Dart, `gen_random_uuid()` in the database), and `random_v7` generates a UUID v7 (`Uuid().v7obj()` in Dart, a generated `gen_random_uuid_v7()` function in the database).

For enums, the persisted value follows the enum's serialization mode. A `byName` enum default is stored as the value's name, and a `byIndex` enum default is stored as its index, e.g. `0` for the first value.

:::info
On an [immutable class](#immutable-classes), or a class extending one, `default` and `defaultModel` cannot use the non-constant values `now`, `random`, or `random_v7`. On a persisted model, use `defaultPersist` for those instead.
:::

### Example

```yaml
class: DefaultValue
table: default_value
fields:
  ### Sets the current date and time as the default value.
  dateTimeDefault: DateTime, default=now

  ### Defaults to false in code and true in the database.
  boolDefault: bool, defaultModel=false, defaultPersist=true

  ### Sets the database-side default value for an integer field.
  intDefault: int, defaultPersist=20

  ### Defaults to 10.5 in code, with a separate database default.
  doubleDefault: double, default=10.5, defaultPersist=20.5
```

## Exception

Model files can define exceptions that can be thrown in endpoints, by using the `exception` keyword. For a more in-depth description of how to work with exceptions, see [Error handling and exceptions](../endpoints-and-apis/error-handling-and-exceptions).

```yaml
exception: MyException
fields:
  message: String
  errorType: MyEnum
```

## Enum

The `enum` keyword defines a custom enum with serialization support.

```yaml
enum: Animal
values:
  - dog
  - cat
  - bird
```

By default the enum is serialized by name. You can also opt into index-based serialization by setting `serialized: byIndex`.

```yaml
enum: Animal
serialized: byIndex
values:
  - dog
  - cat
  - bird
```

The `serialized` keyword has two valid values: `byName` (the default) and `byIndex`. When using `byName` the string literal of the enum is used; when using `byIndex` the index value (0, 1, 2, etc.) is used.

:::warning

Using `byIndex` is fragile: adding, removing, or reordering enum values silently changes the serialized form, which can corrupt persisted data. Only use `byIndex` when you need to maintain compatibility with existing data already serialized that way.

:::

### Handling unknown enum values

A default value is used when an unknown value is deserialized. This can happen, for example, if a new enum option is added and older clients receive it from the server, or if an enum option is removed but the database still contains the old value.

To configure a default value, use the `default` keyword.

```yaml
enum: Animal
serialized: byName
default: unknown
values:
  - unknown
  - dog
  - cat
  - bird
```

In the example above, if the Enum `Animal` receives an unknown option such as `"fish"` it will be deserialized to `Animal.unknown`. This is useful for maintaining backward compatibility when changing the enum values.

:::warning
If no default value is specified, deserialization of unknown values will throw an exception. Adding a default value prevents these exceptions, but may also hide real issues in your data. Use this feature with caution.
:::

### Enhanced enums with properties

Serverpod supports enhanced enums that can have custom properties attached to each value. This is useful when you need to associate additional data with enum values, such as display names, codes, or configuration values.

To define an enhanced enum, add a `properties` section that declares the property names and types, then specify property values for each enum value:

```yaml
enum: HttpStatus
serialized: byName
properties:
  code: int
  message: String
values:
  - ok:
      code: 200
      message: 'OK'
  - notFound:
      code: 404
      message: 'Not Found'
  - internalError:
      code: 500
      message: 'Internal Server Error'
```

This generates an enhanced Dart enum with the specified properties:

```dart
enum HttpStatus implements SerializableModel {
  ok(200, 'OK'),
  notFound(404, 'Not Found'),
  internalError(500, 'Internal Server Error');

  const HttpStatus(this.code, this.message);

  final int code;
  final String message;

  // Serialization methods...
}
```

You can then access the properties on any enum value:

```dart
var status = HttpStatus.ok;
print(status.code);    // 200
print(status.message); // OK
```

#### Supported property types

Enhanced enum properties support the following types:

- `int` / `int?`
- `double` / `double?`
- `bool` / `bool?`
- `String` / `String?`

#### Default property values

Properties can have default values, making them optional when defining enum values. The syntax follows the same pattern as [class field defaults](#default-values):

```yaml
enum: Priority
properties:
  level: int
  description: String, default='No description'
values:
  - low:
      level: 1
  - medium:
      level: 2
      description: 'Medium priority'
  - high:
      level: 3
      description: 'High priority - handle first'
```

In this example, `low` will use the default description `'No description'`, while `medium` and `high` have explicit descriptions.

## Adding documentation

Serverpod allows you to add documentation to your serializable objects in a similar way that you would add documentation to your Dart code. Use three hashes (###) to indicate that a comment should be considered documentation.

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

## Generated code

Serverpod generates some convenience methods on the Dart classes.

### copyWith

The `copyWith` method creates a copy of an object with selective field updates and is available on all generated classes:

```dart
// User has a nullable age field: age: int?
var john = User(name: 'John Doe', age: 25);
var jane = john.copyWith(name: 'Jane Doe'); // age stays 25
var ageless = john.copyWith(age: null);     // age is explicitly set to null
```

The `copyWith` method generates a deep copy of an object, preserving all original fields unless explicitly modified. As the example shows, it distinguishes between a nullable field set to `null` and a field left unspecified.

### toJson / fromJson

The `toJson` and `fromJson` methods are generated on all models to help with serialization. Serverpod manages all serialization for you out of the box and you will rarely have to use these methods yourself. See [Custom serialization](./models/custom-serialization) for more info. On the server, models also get a `toJsonForProtocol` method that produces the JSON sent to clients. It leaves out fields whose [scope](#limiting-visibility-of-a-generated-class) hides them from the client.

### Custom methods

Sometimes you will want to add custom methods to the generated classes. The easiest way to do this is with [Dart's extension feature](https://dart.dev/language/extension-methods).

```dart
extension MyExtension on MyClass {
  bool isCustomMethod() {
    return true;
  }
}
```

## Related

- [Model reference](../lookups/model-reference): every keyword available in a model file, and whether it applies to a `class`, `exception`, or `enum`.
- [Tables](./database/tables): store a model in the database.
- [Backward compatibility](../endpoints-and-apis/backward-compatibility): evolve models without breaking older app versions.
