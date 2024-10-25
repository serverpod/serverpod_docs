# Experimental features

:::warning
Experimental features should not be used in production environments, as their stability is uncertain and they may receive breaking changes in upcoming releases.
:::

"Experimental Features" are cutting-edge additions to Serverpod that are currently under development or testing. These features allow developers to explore new functionalities and provide feedback, helping shape the future of Serverpod. However, they may not be fully stable or complete and are subject to change.

By default, experimental features are disabled. To opt into using them, include the `--experimental-features` flag when running the serverpod command:

```bash
$ serverpod generate --experimental-features=all
```

The current options you can pass are:

|**Feature**|Description|
|:-----|:---|
| **all** | Enables all available experimental features. |
| **inheritance** | Allows using the `extends` keyword in your model files to create class hierarchies.|
| **testTools** | Generates the Serverpod test tools, see the [testing get started page](testing/get-started) for more information.|

## Inheritance

Inheritance allows you to define class hierarchies in your model files by sharing fields between parent and child classes, simplifying class structures and promoting consistency by avoiding duplicate field definitions.

### Extending a  Class

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
    int: age
```

This will generate a class with both `name` and `age` field.

```dart
class ChildClass extends ParentClass {
    String name
    int age
}
```

### Sealed Classes

In addition to the `extends` keyword, you can also use the `sealed` keyword to create sealed class hierarchies. A sealed class restricts which other classes can extend or implement it, allowing for more controlled inheritance. For example:

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

:::info
All files in a sealed hierarchy need to be located in the same sub directory.
:::
