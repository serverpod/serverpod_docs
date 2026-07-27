---
description: Referential actions control how updates and deletes propagate across related tables through the onUpdate and onDelete properties.
---

# Referential actions

What happens to rows that reference a row you delete, or whose id changes? The `onUpdate` and `onDelete` properties on any relation answer that, and they map directly to the database's referential actions. In practice `onUpdate` rarely fires, since ids are stable.

## Available referential actions

| Action | Description |
| --- | --- |
| **NoAction** | If any constraint violation occurs, no action will be taken, and an error will be raised. |
| **Restrict** | If any referencing rows still exist when the constraint is checked, an error is raised. |
| **SetDefault** | The field will revert to its default value. Requires a default value on the field. |
| **Cascade** | Any action taken on the parent (update/delete) will be mirrored in the child. |
| **SetNull** | The field value is set to null. This action is permissible only if the field has been marked as optional. |

## Syntax

Use the following syntax to apply referential actions:

```yaml
relation(onUpdate=<ACTION>, onDelete=<ACTION>)
```

## Default values

If no referential actions are specified, the default behavior will be applied.

If the relation is defined as an [object relation](one-to-one#with-an-object), the default behavior is `NoAction` for both onUpdate and onDelete, equivalent to writing:

```yaml
parent: Model?, relation(onUpdate=NoAction, onDelete=NoAction)
```

If the relation is defined as an [id relation](one-to-one#with-an-id-field), the default behavior is `NoAction` for onUpdate and `Cascade` for onDelete, equivalent to writing:

```yaml
parentId: int?, relation(parent=model_table, onUpdate=NoAction, onDelete=Cascade)
```

The order of `onUpdate` and `onDelete` in the relation does not matter.

### Full example

```yaml
class: Example
table: example
fields:
  parentId: int?, relation(parent=example, onUpdate=SetNull, onDelete=NoAction)
```

In the given example, if the `example` parent is updated, the `parentId` will be set to null. If the parent is deleted, no action will be taken for parentId.
