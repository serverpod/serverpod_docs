# Working with models

Models are Yaml files used to define serializable classes in Serverpod. They are used to generate Dart code for the server and client, and, if a database table is defined, to generate database code for the server. Using regular `.yaml` files within `lib/src/models` is supported, but it is recommended to use `.spy.yaml` (.spy stands for "Server Pod Yaml") to leverage syntax highlighting provided by the [Serverpod Extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod) for VS Code.

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

Supported types are [bool](https://api.dart.dev/dart-core/bool-class.html), [int](https://api.dart.dev/dart-core/int-class.html), [double](https://api.dart.dev/dart-core/double-class.html), [String](https://api.dart.dev/dart-core/String-class.html), [Duration](https://api.dart.dev/dart-core/Duration-class.html), [DateTime](https://api.dart.dev/dart-core/DateTime-class.html), [ByteData](https://api.dart.dev/dart-typed_data/ByteData-class.html), [UuidValue](https://pub.dev/documentation/uuid/latest/uuid_value/UuidValue-class.html), and other serializable [classes](#class), [exceptions](#exception) and [enums](#enum). You can also use [List](https://api.dart.dev/dart-core/List-class.html)s and [Map](https://api.dart.dev/dart-core/Map-class.html)s of the supported types, just make sure to specify the types. Null safety is supported. Once your classes are generated, you can use them as parameters or return types to endpoint methods.

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

```yaml
class: SelectivelyHiddenClass
fields:
  hiddenSecretKey: String, scope=serverOnly
  publicKey: String
```

:::info
Serverpod's models can easily be saved to or read from the database. You can read more about this in the [Database](database/models) section.
:::

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

It's recommended to always set `serialized` to `byName` in any new Enum models, as this is less fragile and will be changed to the default setting in version 2 of Serverpod.

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

## Generated code

Serverpod generates some convenience methods on the Dart classes.

### copyWith

The `copyWith` method allows for efficient object copying with selective field updates and is available on all generated `class`es. Here's how it operates:

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

## Keywords

|**Keyword**|Note|[class](#class)|[exception](#exception)|[enum](#enum)|
|---|---|:---:|:---:|:---:|
|[**values**](#enum)|A special key for enums with a list of all enum values.                                                                |||✅|
|[**serialized**](#enum)|Sets the mode enums are serialized in                                                                              |||✅|
|[**serverOnly**](#limiting-visibility-of-a-generated-class)|Boolean flag if code generator only should create the code for the server.     |✅|✅|✅|
|[**table**](database/models)|A name for the database table, enables generation of database code.                                           |✅|||
|[**managedMigration**](database/migrations#opt-out-of-migrations)|A boolean flag to opt out of the database migration system.                                        |✅|||
|[**fields**](#class)|All fields in the generated class should be listed here.                                                              |✅|✅||
|[**type (fields)**](#class)|Denotes the data type for a field.                                                                             |✅|✅||
|[**scope**](#limiting-visibility-of-a-generated-class)|Denotes the scope for a field.                                                      |✅|||
|[**persist**](database/models)|A boolean flag if the data should be stored in the database or not can be negated with `!persist` |✅|||
|[**relation**](database/relations/one-to-one)|Sets a relation between model files, requires a table name to be set.              |✅|||
|[**name**](database/relations/one-to-one#bidirectional-representation)|Give a name to a relation to pair them.                   |✅|||
|[**parent**](database/relations/one-to-one#one-side-defined)|Sets the parent table on a relation.                                |✅|||
|[**field**](database/relations/one-to-one#custom-foreign-key-field)|A manual specified foreign key field.                        |✅|||
|[**onUpdate**](database/relations/referential-actions)|Set the referential actions when updating data in the database.           |✅|||
|[**onDelete**](database/relations/referential-actions)|Set the referential actions when deleting data in the database.           |✅|||
|[**optional**](database/relations/one-to-one#optional-relation)|A boolean flag to make a relation optional.                      |✅|||
|[**indexes**](database/indexing)|Create indexes on your fields / columns.                                                        |✅|||
|[**fields (index)**](database/indexing)|List the fields to create the indexes on.                                                |✅|||
|[**type (index)**](database/indexing)|The type of index to create.                                                               |✅|||
|[**unique**](database/indexing)|Boolean flag to make the entries unique in the database.                                         |✅|||

## Default Values

Serverpod supports defining default values for fields in your models. These defaults can be specified using the following keywords:

#### Keywords

- **default**: Sets the default value for both the model and the database.
- **defaultModel**: Sets the default value for the model side.
- **defaultDatabase**: Sets the default value for the database side.

#### Supported Default Values

- **DateTime**: Supports "now" (current date and time) and DateTime formatted strings (only in UTC).

  The UTC format should be: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'".

#### Example

```yaml
class: DefaultValue
table: default_value
fields:
  ### Sets the current date and time as the default value.
  dateTimeNow: DateTime, default=now

  ### Sets a specific DateTime formatted string in UTC as the default value.
  dateTimeStr: DateTime, default=2024-05-34T22:00:00.000Z

  ### Sets a specific DateTime formatted string in UTC as the default value for the model side.
  ### This value will also be persisted in the database.
  dateTimeModel: DateTime, defaultModel=2024-05-34T22:00:00.000Z

  ### Sets a specific DateTime formatted string in UTC as the default value for the database side.
  ### If no value is set, this default will be used when the field is persisted in the database.
  ### Fields with 'defaultDatabase' must be nullable.
  dateTimeDatabase: DateTime?, defaultDatabase=2024-05-34T22:00:00.000Z

  ### Sets different default values for the model and the database sides.
  dateTimeModelAndDatabase: DateTime, defaultModel=2024-05-01T22:00:00.000Z, defaultDatabase=2024-05-10T22:00:00.000Z
```

- **Other Types**: Currently, default values are only supported for the DateTime field type.

### Restrictions

- **relation** keyword cannot be used with defaults.
- **!persist** keyword cannot be used when **defaultDatabase** is specified.
