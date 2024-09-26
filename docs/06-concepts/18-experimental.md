# Experimental features

"Experimental Features" are cutting-edge additions to Serverpod that are currently under development or testing. These features allow developers to explore new functionalities and provide feedback, helping shape the future of Serverpod. However, they may not be fully stable or complete and are subject to change.

By default, experimental features are disabled. To opt into using them, include the `--experimental-features` flag when running the serverpod command:

```bash
$ serverpod generate --experimental-features=all
```

The current options you can pass are:

- all
- inheritance

:::warning
Experimental features are not recommended for use in production environments as they may have unexpected behavior or change in future releases.
:::

## Inheritance

Inheritance allows you to define class hierarchies in your `yaml` files by sharing fields between parent and child classes, simplifying class structures and promoting consistency by avoiding duplicate field definitions.

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

:::info
Inheritance currently does not work for `classes` with a `table` field.
:::
