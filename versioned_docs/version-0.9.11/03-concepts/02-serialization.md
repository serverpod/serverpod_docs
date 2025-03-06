# Serialization
Serverpod makes it easy to generate serializable classes that can be passed between server and client or used to communicate with the database. The structure for the classes is defined in YAML-files in the `protocol` directory. Run `serverpod generate` to build the Dart code for the classes and make them accessible to both the server and client.

Here is a simple example of a YAML-file defining a serializable class:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>
```

Supported types are `bool`, `int`, `double`, `String`, `DateTime`, `ByteData`, and other serializable classes. You can also use `List`s and `Map`s of the supported types. Null safety is supported. The keys of `Map` must be non-nullable `String`s Once your classes are generated, you can use them as parameters or return types to endpoint methods.
