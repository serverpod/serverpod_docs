# Working with protocols

Protocols are the YAML files used to define serializable classes in Serverpod. They are used to generate Dart code for the server and client, and, if a database table is defined, to generate database code for the server.

The files are analyzed by the Serverpod CLI when generating the project and creating migrations.

Run `serverpod generate` to generate dart classes from the protocol files.

## Class

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>
```

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
Serverpod's serializable objects can easily be saved to or read from the database. You can read more about this in the [Database](database/models) section.
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
|[**table**](database/models)|A name for the database table, enables generation of database code.                                 |✅|||
|[**fields**](#class)|All fields in the generated class should be listed here.                                                              |✅|✅||
|[**type (fields)**](#class)|Denotes the data type for a field.                                                                             |✅|✅||
|[**scope**](#limiting-visibility-of-a-generated-class)|Denotes the scope for a field.                                                      |✅|||
|[**persist**](database/models)|A boolean flag if the data should be stored in the database or not can be negated with `!persist` |✅|||
|[**relation**](database/relations/one-to-one)|Sets a relation between protocol files, requires a table name to be set.           |✅|||
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
