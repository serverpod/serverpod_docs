# Serializing data

Serverpod makes it easy to generate serializable classes that can be passed between server and client or used to communicate with the database.

The structure for your serialized classes is defined in `.spy.yaml` files anywhere in the `lib` directory. Run `serverpod generate` in the home directory of the server to build the Dart code for the classes and make them accessible to both the server and client.

Here is a simple example of a `.spy.yaml` file defining a serializable class:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
```

Supported types are `bool`, `int`, `double`, `String`, `DateTime`, `ByteData`, and other serializable classes. You can also use `List`s and `Map`s of the supported types, just make sure to specify the types. Null safety is supported. The keys of `Map` must be non-nullable `String`s. Once your classes are generated, you can use them as parameters or return types to endpoint methods.

:::tip

You can also create custom serialized classes with tools such as Freezed. Learn more in the [Serialization](../concepts/serialization) section.

:::
