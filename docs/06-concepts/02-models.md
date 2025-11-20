# Working with models

Models are Yaml files used to define serializable classes in Serverpod. They are used to generate Dart code for the server and client, and, if a database table is defined, to generate database code for the server.

Using regular `.yaml` files within `lib/src/models` is supported, but it is recommended to use `.spy.yaml` (.spy stands for "Serverpod YAML"). Using this file type allows placing the model files anywhere in your servers `lib` directory and enables syntax highlighting provided by the [Serverpod Extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod) for VS Code.

The files are analyzed by the Serverpod CLI when generating the project and creating migrations.

Run `serverpod generate` to generate dart classes from the model files.

## Class

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>
```

Supported types are [bool](https://api.dart.dev/dart-core/bool-class.html), [int](https://api.dart.dev/dart-core/int-class.html), [double](https://api.dart.dev/dart-core/double-class.html), [String](https://api.dart.dev/dart-core/String-class.html), [Duration](https://api.dart.dev/dart-core/Duration-class.html), [DateTime](https://api.dart.dev/dart-core/DateTime-class.html), [ByteData](https://api.dart.dev/dart-typed_data/ByteData-class.html), [UuidValue](https://pub.dev/documentation/uuid/latest/uuid_value/UuidValue-class.html), [Uri](https://api.dart.dev/dart-core/Uri-class.html), [BigInt](https://api.dart.dev/dart-core/BigInt-class.html), [Vector](#vector), [HalfVector](#halfvector), [SparseVector](#sparsevector), [Bit](#bit) and other serializable [classes](#class), [exceptions](#exception) and [enums](#enum). You can also use [List](https://api.dart.dev/dart-core/List-class.html)s, [Map](https://api.dart.dev/dart-core/Map-class.html)s and [Set](https://api.dart.dev/dart-core/Set-class.html)s of the supported types, just make sure to specify the types. All supported types can also be used inside [Record](https://api.dart.dev/dart-core/Record-class.html)s. Null safety is supported. Once your classes are generated, you can use them as parameters or return types to endpoint methods.

### Required fields

Nullable types are supported by adding a `?` after the type. E.g., `String?` or `List<Employee>?`. The optional `required` keyword makes the generated field a required constructor parameter.

```yaml
class: Person
fields:
  name: String
  nickname: String?, required
  age: int?
```

In the example above, `nickname` will be a required constructor parameter.

### Limiting visibility of a generated class

By default, generated code for your serializable objects is available both on the server and the client. You may want to have the code on the server side only. E.g., if the serializable object is connected to a database table containing private information.

To make a serializable class generated only on the server side, set the serverOnly property to true.

```yaml
class: MyPrivateClass
serverOnly: true
fields:
  hiddenSecretKey: String
```

It is also possible to set a `scope` on a per-field basis. By default all fields are visible to both the server and the client. The available scopes are `all`, `serverOnly`, `none`.

:::info
**none** is not typically used in serverpod apps. It is intended for the serverpod framework, itself.
:::

```yaml
class: SelectivelyHiddenClass
fields:
  hiddenSecretKey: String, scope=serverOnly
  publicKey: String
```

:::info
Serverpod's models can easily be saved to or read from the database. You can read more about this in the [Database](database/models) section.
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

## Inheritance

Serverpod models support inheritance, which allows you to define class hierarchies that share fields between parent and child classes. This simplifies class structures and promotes consistency by avoiding duplicate field definitions. Generated classes will maintain the same type hierarchy as the model files.

:::warning
Adding a new subtype to a class hierarchy may introduce breaking changes for older clients. Ensure client compatibility when expanding class hierarchies to avoid deserialization issues.
:::

### Extending a Class

To inherit from a class, use the `extends` keyword in your model files, as shown below:

```yaml
class: ParentClass
fields:
  name: String
```

```yaml
class: ChildClass
extends: ParentClass
fields:
  age: int
```

This will generate a class with both `name` and `age` fields.

#### Inheritance on table models

Inheritance can also be used with table models. However, **only one class** in an inheritance hierarchy can have a `table` property defined. The table can be placed at any level in the inheritance chain (top, middle or bottom).

:::info
This is a current limitation due to the parent class implementing the `table` getter and other table-related fields, so classes that `extends` the parent cannot override such properties with different types. This might be lifted with a future implementation of `interface` support for table models.
:::

When a class in the hierarchy has a table, all inherited fields are stored as columns in that table. The `id` field is automatically added to table classes and inherited by child classes. You can customize the `id` type in a parent class, and children will inherit it.

A common use case for inheritance on table models is to have a base class that defines a custom `id` type, audit fields and other common properties that must be present on several table models. Below is an example:

```yaml
class: BaseClass
fields:
  id: UuidValue?, defaultPersist=random_v7
  createdAt: DateTime, default=now
  updatedAt: DateTime, default=now
```

```yaml
class: ChildClass
extends: BaseClass
table: child_table
fields:
  name: String

indexes:
  created_at_index:
    fields: createdAt  # Index on inherited field
```

**ServerOnly Inheritance**: If a parent class is marked as `serverOnly`, all child classes must also be marked as `serverOnly`. A non-serverOnly class cannot extend a serverOnly class, but a serverOnly child can extend a non-serverOnly parent.

**Additional Restrictions**:

- You can only extend classes from your own project, not from modules.
- Child classes cannot redefine fields that exist in parent classes.

Indexes can be defined on inherited fields in a child class with a table, and relations work normally with inherited table classes.

### Sealed Classes

In addition to the `extends` keyword, you can also use the `sealed` keyword to create sealed class hierarchies, enabling exhaustive type checking. With sealed classes, the compiler knows all subclasses, ensuring that every possible case is handled when working with the model.

:::info
If a class is sealed, it cannot have a table property. This is because a sealed class is abstract and cannot be instantiated, so it cannot represent a table row.
:::

```yaml
class: ParentClass
sealed: true
fields:
  name: String
```

```yaml
class: ChildClass
extends: ParentClass
fields:
  age: int
```

This will generate the following classes:

```dart
sealed class ParentClass {
  String name;
}

class ChildClass extends ParentClass {
  String name;
  int age;
}
```

## Polymorphism Support

Serverpod supports polymorphism for models that use inheritance. When you define a class hierarchy you can use parent types as parameters and return types in your endpoints, and Serverpod will automatically serialize and deserialize the correct subtype based on the runtime type.

Below is an example of a polymorphic model hierarchy. The `EmailNotification` and `SMSNotification` classes extend the `Notification` sealed class. Each notification type has its own table and specific fields for delivery. Note that it is not possible to define relations towards the `Notification` class, since it does not have a table.

```yaml
class: Notification
sealed: true
fields:
  title: String
  message: String
  createdAt: DateTime, default=now
  sentAt: DateTime?
```

```yaml
class: EmailNotification
extends: Notification
table: email_notification
fields:
  recipientEmail: String
  subject: String
```

```yaml
class: SMSNotification
extends: Notification
table: sms_notification
fields:
  phoneNumber: String
  provider: String?
```

### Using Polymorphic Types in Endpoints

Polymorphic types can be used as parameters and return types in endpoint methods and streaming endpoints. The runtime type is preserved through serialization and deserialization:

```dart
class NotificationEndpoint extends Endpoint {
  Future<Notification> sendNotification(
    Session session, {
    required Notification notification,
  }) async {
    final sentNotification = switch (notification) {
      EmailNotification email => await _sendEmail(session, email),
      SMSNotification sms => await _sendSMS(session, sms),
    };

    return sentNotification.copyWith(sentAt: DateTime.now());
  }

  /// Save to database and send email
  Future<EmailNotification> _sendEmail(
    Session session,
    EmailNotification notification,
  ) async {
    final saved = await EmailNotification.db.insertRow(session, notification);
    // ... email sending logic
    return saved;
  }

  /// Save to database and send SMS
  Future<SMSNotification> _sendSMS(
    Session session,
    SMSNotification notification,
  ) async {
    final saved = await SMSNotification.db.insertRow(session, notification);
    // ... SMS sending logic
    return saved;
  }
}
```

Polymorphic types also work seamlessly in Lists, Maps, Sets, Records, and nullable contexts.

## Exception

The Serverpod models supports creating exceptions that can be thrown in endpoints by using the `exception` keyword. For more in-depth description on how to work with exceptions see [Error handling and exceptions](exceptions).

```yaml
exception: MyException
fields:
  message: String
  errorType: MyEnum
```

## Enum

It is easy to add custom enums with serialization support by using the `enum` keyword.

```yaml
enum: Animal
values:
 - dog
 - cat
 - bird
```

By default the serialization will convert the enum to an int representing the index of the value. Changing the order may therefore have unforeseen consequences when reusing old data (such as from a database). Changing the serialization to be based on the name instead of index is easy.

```yaml
enum: Animal
serialized: byName
values:
 - dog
 - cat
 - bird
```

`serialized` has two valid values `byName` and `byIndex`. When using `byName` the string literal of the enum is used, when using `byIndex` the index value (0, 1, 2, etc) is used.

:::info

It's recommended to always set `serialized` to `byName` in any new Enum models, as this is less fragile and will be changed to the default setting in version 3 of Serverpod.

:::

### Default value

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

## Vector fields

Vector types are used for storing high-dimensional vectors, which are especially useful for similarity search operations.

When specifying vector types, the dimension is required between parentheses (e.g., `Vector(1536)`). Common dimensions include:

- 1536 (OpenAI embeddings)
- 768 (many sentence transformers)
- 384 (smaller models)

All vector types support specialized distance operations for similarity search and filtering. See the [Vector distance operators](database/filter#vector-distance-operators) section for details.

To ensure optimal performance with vector similarity searches, consider creating specialized vector indexes on your vector fields. See the [Vector indexes](database/indexing#vector-indexes) section for more details.

:::info
The usage of Vector fields requires the pgvector PostgreSQL extension to be installed, which comes by default on new Serverpod projects. To upgrade an existing project, see the [Upgrading to pgvector support](../upgrading/upgrade-to-pgvector) guide.
:::

### Vector

The `Vector` type stores full-precision floating-point vectors for general-purpose embeddings.

```yaml
class: Document
table: document
fields:
  ### The category of the document (e.g., article, tutorial).
  category: String

  ### The contents of the document.
  content: String

  ### A vector field for storing document embeddings
  embedding: Vector(1536)
```

### HalfVector

The `HalfVector` type uses half-precision (16-bit) floating-point numbers, providing memory savings with acceptable precision loss for several applications.

```yaml
class: Document
table: document
fields:
  content: String
  ### Half-precision embedding for memory efficiency
  embedding: HalfVector(1536)
```

### SparseVector

The `SparseVector` type efficiently stores sparse vectors where most values are zero, which is ideal for high-dimensional data with few non-zero elements.

```yaml
class: Document
table: document
fields:
  content: String
  ### Sparse vector for keyword-based embeddings
  keywords: SparseVector(10000)
```

### Bit

The `Bit` type stores binary vectors where each element is 0 or 1, offering maximum memory efficiency for binary embeddings.

```yaml
class: Document
table: document
fields:
  content: String
  ### Binary vector for semantic hashing
  hash: Bit(256)
```

## Generated code

Serverpod generates some convenience methods on the Dart classes.

### copyWith

The `copyWith` method allows for efficient object copying with selective field updates and is available on all generated classes. Here's how it operates:

```dart
var john = User(name: 'John Doe', age: 25);
var jane = john.copyWith(name: 'Jane Doe');
```

The `copyWith` method generates a deep copy of an object, preserving all original fields unless explicitly modified. It can distinguish between a field set to `null` and a field left unspecified (undefined). When using `copyWith`, any field you don't update remains unchanged in the new object.

### toJson / fromJson

The `toJson` and `fromJson` methods are generated on all models to help with serialization. Serverpod manages all serialization for you out of the box and you will rarely have to use these methods by your self. See the [Serialization](serialization) section for more info.

### Custom methods

Sometimes you will want to add custom methods to the generated classes. The easiest way to do this is with [Dart's extension feature](https://dart.dev/language/extension-methods).

```dart
extension MyExtension on MyClass {
  bool isCustomMethod() {
    return true;
  }
}
```

## Default Values

Serverpod supports defining default values for fields in your models. These default values can be specified using three different keywords that determine how and where the defaults are applied:

### Keywords

- **default**: This keyword sets a default value for both the model (code) and the database (persisted data). It acts as a general fallback if more specific defaults aren't provided.
- **defaultModel**: This keyword sets a default value specifically for the model (the code side). If `defaultModel` is not provided, the model will use the value specified by `default` if it's available.
- **defaultPersist**: This keyword sets a default value specifically for the database. If `defaultPersist` is not provided, the database will use the value specified by `default` if it's available.

### How priorities work

- **For the model (code side):** If both `defaultModel` and `default` are provided, the model will use the `defaultModel` value. If `defaultModel` is not provided, it will fall back to using the `default` value.
- **For the database (persisted data):** If both `defaultPersist` and `default` are provided, the database will use the `defaultPersist` value. If `defaultPersist` is not provided, it will fall back to using the `default` value.

You can use these default values individually or in combination as needed. It is not required to use all default types for a field.

:::info

When using `default` or `defaultModel` in combination with `defaultPersist`, it's important to understand how the interaction between these keywords affects the final value in the database.

If you set a `default` or `defaultModel` value, the model's field or variable will have a value when it's passed to the database—it will not be `null`. Because of this, the SQL query will not use the `defaultPersist` value since the field already has a value assigned by the model. In essence, assigning a `default` or `defaultModel` is like directly providing a value to the field, and the database will use this provided value instead of its own default.

This means that `defaultPersist` only comes into play when the model does not provide a value, allowing the database to apply its own default setting.

:::

### Supported default values

#### Boolean

| Type        | Keyword           | Description                                                  |
| ----------- | ----------------- | ------------------------------------------------------------ |
| **Boolean** | `true` or `false` | Sets the field to a boolean value, either `true` or `false`. |

**Example:**

```yaml
boolDefault: bool, default=true
```

#### DateTime

| Type                      | Keyword                                                          | Description                                  |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| **Current Date and Time** | `now`                                                            | Sets the field to the current date and time. |
| **Specific UTC DateTime** | UTC DateTime string in the format `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'` | Sets the field to a specific date and time.  |

**Example:**

```yaml
dateTimeDefaultNow: DateTime, default=now
dateTimeDefaultUtc: DateTime, default=2024-05-01T22:00:00.000Z
```

#### Double

| Type       | Keyword          | Description                                |
| ---------- | ---------------- | ------------------------------------------ |
| **Double** | Any double value | Sets the field to a specific double value. |

**Example:**

```yaml
doubleDefault: double, default=10.5
```

#### Duration

| Type                  | Keyword                                            | Description                                                                                                                                                |
| --------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Specific Duration** | A valid duration in the format `Xd Xh Xmin Xs Xms` | Sets the field to a specific duration value. For example, `1d 2h 10min 30s 100ms` represents 1 day, 2 hours, 10 minutes, 30 seconds, and 100 milliseconds. |

**Example:**

```yaml
durationDefault: Duration, default=1d 2h 10min 30s 100ms
```

#### Enum

| Type     | Keyword              | Description                              |
| -------- | -------------------- | ---------------------------------------- |
| **Enum** | Any valid enum value | Sets the field to a specific enum value. |

**Example:**

```yaml
enum: ByNameEnum
serialized: byName
values:
  - byName1
  - byName2
```

```yaml
enum: ByIndexEnum
serialized: byIndex
values:
  - byIndex1
  - byIndex2
```

```yaml
class: EnumDefault
table: enum_default
fields:
  byNameEnumDefault: ByNameEnum, default=byName1
  byIndexEnumDefault: ByIndexEnum, default=byIndex1
```

In this example:

- The `byNameEnumDefault` field will default to `'byName1'` in the database.
- The `byIndexEnumDefault` field will default to `0` (the index of `byIndex1`).

#### Integer

| Type        | Keyword           | Description                                 |
| ----------- | ----------------- | ------------------------------------------- |
| **Integer** | Any integer value | Sets the field to a specific integer value. |

**Example:**

```yaml
intDefault: int, default=10
```

#### String

| Type       | Keyword          | Description                                |
| ---------- | ---------------- | ------------------------------------------ |
| **String** | Any string value | Sets the field to a specific string value. |

**Example:**

```yaml
stringDefault: String, default='This is a string'
```

#### UuidValue

| Type              | Keyword                                                                                                                                                                                                   | Description                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Random UUID**   | `random`                                                                                                                                                                                                  | Generates a random UUID. On the Dart side, `Uuid().v4obj()` is used. On the database side, `gen_random_uuid()` is used.                           |
| **Random UUIDv7** | `random_v7`                                                                                                                                                                                               | Generates a random UUIDv7. On the Dart side, `Uuid().v7obj()` is used. On the database side, a generated `gen_random_uuid_v7()` function is used. |
| **UUID String**   | Valid UUID in the format 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx' where M is the UUID version field. The upper two or three bits of digit N encode the variant. E.g. '550e8400-e29b-41d4-a716-446655440000' | Assigns a specific UUID to the field.                                                                                                             |

**Example:**

```yaml
uuidDefaultRandom: UuidValue, default=random
uuidDefaultUuid: UuidValue, default='550e8400-e29b-41d4-a716-446655440000'
uuidDefaultRandomUuidV7: UuidValue, default=random_v7
```

### Example

```yaml
class: DefaultValue
table: default_value
fields:
  ### Sets the current date and time as the default value.
  dateTimeDefault: DateTime, default=now

  ### Sets the default value for a boolean field.
  boolDefault: bool, defaultModel=false, defaultPersist=true

  ### Sets the default value for an integer field.
  intDefault: int, defaultPersist=20

  ### Sets the default value for a double field.
  doubleDefault: double, default=10.5, defaultPersist=20.5

  ### Sets the default value for a string field.
  stringDefault: String, default="This is a string", defaultModel="This is a string"
```

## Keywords

| **Keyword**                                                         | Note                                                                                                           | [class](#class) | [exception](#exception) | [enum](#enum) |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | :-------------: | :---------------------: | :-----------: |
| [**values**](#enum)                                                 | A special key for enums with a list of all enum values.                                                        |                 |                         |       ✅       |
| [**serialized**](#enum)                                             | Sets the mode enums are serialized in                                                                          |                 |                         |       ✅       |
| [**immutable**](#immutable-classes)                                 | Boolean flag to generate an immutable class with final fields, equals operator, and hashCode.                  |        ✅        |            ✅            |               |
| [**serverOnly**](#limiting-visibility-of-a-generated-class)         | Boolean flag if code generator only should create the code for the server.                                     |        ✅        |            ✅            |       ✅       |
| [**table**](database/models)                                        | A name for the database table, enables generation of database code.                                            |        ✅        |                         |               |
| [**managedMigration**](database/migrations#opt-out-of-migrations)   | A boolean flag to opt out of the database migration system.                                                    |        ✅        |                         |               |
| [**fields**](#class)                                                | All fields in the generated class should be listed here.                                                       |        ✅        |            ✅            |               |
| [**type (fields)**](#class)                                         | Denotes the data type for a field.                                                                             |        ✅        |            ✅            |               |
| [**required**](#required-fields)                                    | Makes the field as required. This keyword can only be used for **nullable** fields.                            |        ✅        |            ✅            |               |
| [**scope**](#limiting-visibility-of-a-generated-class)              | Denotes the scope for a field.                                                                                 |        ✅        |                         |               |
| [**persist**](database/models)                                      | A boolean flag if the data should be stored in the database or not can be negated with `!persist`              |        ✅        |                         |               |
| [**relation**](database/relations/one-to-one)                       | Sets a relation between model files, requires a table name to be set.                                          |        ✅        |                         |               |
| [**name**](database/relations/one-to-one#bidirectional-relations)   | Give a name to a relation to pair them.                                                                        |        ✅        |                         |               |
| [**parent**](database/relations/one-to-one#with-an-id-field)        | Sets the parent table on a relation.                                                                           |        ✅        |                         |               |
| [**field**](database/relations/one-to-one#custom-foreign-key-field) | A manual specified foreign key field.                                                                          |        ✅        |                         |               |
| [**onUpdate**](database/relations/referential-actions)              | Set the referential actions when updating data in the database.                                                |        ✅        |                         |               |
| [**onDelete**](database/relations/referential-actions)              | Set the referential actions when deleting data in the database.                                                |        ✅        |                         |               |
| [**optional**](database/relations/one-to-one#optional-relation)     | A boolean flag to make a relation optional.                                                                    |        ✅        |                         |               |
| [**indexes**](database/indexing)                                    | Create indexes on your fields / columns.                                                                       |        ✅        |                         |               |
| [**fields (index)**](database/indexing)                             | List the fields to create the indexes on.                                                                      |        ✅        |                         |               |
| [**type (index)**](database/indexing)                               | The type of index to create.                                                                                   |        ✅        |                         |               |
| [**parameters (index)**](database/indexing#vector-indexes)          | Parameters for specialized index types like HNSW and IVFFLAT vector indexes.                                   |        ✅        |                         |               |
| [**distanceFunction (index)**](database/indexing#vector-indexes)    | Distance function for vector indexes (l2, innerProduct, cosine, l1).                                           |        ✅        |                         |               |
| [**unique**](database/indexing)                                     | Boolean flag to make the entries unique in the database.                                                       |        ✅        |                         |               |
| [**default**](#default-values)                                      | Sets the default value for both the model and the database. This keyword cannot be used with **relation**.     |        ✅        |                         |               |
| [**defaultModel**](#default-values)                                 | Sets the default value for the model side. This keyword cannot be used with **relation**.                      |        ✅        |                         |               |
| [**defaultPersist**](#default-values)                               | Sets the default value for the database side.  This keyword cannot be used with **relation** and **!persist**. |        ✅        |                         |               |
| [**extends**](#inheritance)                                         | Specifies a parent class to inherit from.                                                                      |        ✅        |            ✅            |               |
| [**sealed**](#inheritance)                                          | Boolean flag to create a sealed class hierarchy, enabling exhaustive type checking.                            |        ✅        |                         |               |
