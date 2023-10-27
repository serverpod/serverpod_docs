# Referential actions

In Serverpod, the behavior of update and delete for relations can be precisely defined using the onUpdate and onDelete properties. These properties map directly to the corresponding referential actions in PostgreSQL.

## Available Referential Actions

* **NoAction**: If any constraint violation occurs, no action will be taken, and an error will be raised.
* **Restrict**: If any referencing rows still exist when the constraint is checked, an error is raised.
* **SetDefault**: The field will revert to its default value. Note: This action necessitates that a default value is configured for the field.
* **Cascade**: Any action taken on the parent (update/delete) will be mirrored in the child.
* **SetNull**: The field value is set to null. This action is permissible only if the field has been marked as optional.

## Syntax

Use the following syntax to apply referential actions

```yaml
relation(onUpdate = ACTION, onDelete = ACTION)
```

For instance, the default behavior in Serverpod can be expressed as.

```yaml
relation(onUpdate = NoAction, onDelete = Cascade)
```

### Full example

```yaml
class: Example
table: example
fields:
  parentId: int?, relation(parent = example, onUpdate = SetNull, onDelete = NoAction)
```

In the given example, if the `example` parent is updated, the `parentId` will be set to null. If the parent is deleted, no action will be taken for parentId.

:::info

The sequence of onUpdate and onDelete is interchangeable.

:::
