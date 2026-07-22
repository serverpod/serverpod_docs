---
description: Database relations in Serverpod link rows across tables with foreign keys, in one-to-one, one-to-many, many-to-many, and self-referencing shapes.
---

# Relations

A relation links rows in one table to rows in another through a foreign key, and the database keeps the link consistent. This is the alternative to embedding a model as a [`json` column](tables#data-representation): related data lives in its own table, can be queried on its own, and is never duplicated per row.

Relations are declared in the model file with the `relation` keyword. There are two forms:

- An **object relation** types the field as the related model, e.g. `address: Address?, relation`. The related object can be fetched together with the row through [relation queries](relation-queries).
- An **id relation** stores only the foreign key, e.g. `addressId: int, relation(parent=address)`. You read and set the id yourself, and nothing else is fetched.

## Choose a relation shape

| Shape | Use when | Example on the page |
| --- | --- | --- |
| [One-to-one](relations/one-to-one) | A row pairs with at most one row of the other table. | A `User` with one `Address`. |
| [One-to-many](relations/one-to-many) | One row owns any number of related rows. | A `Company` with many `Employee` rows. |
| [Many-to-many](relations/many-to-many) | Rows on both sides connect freely, through a junction table. | `Student` and `Course` joined by `Enrollment`. |
| [Self-relations](relations/self-relations) | Rows relate to rows in the same table. | A `Cat` linking to its mother and kittens. |
| [Relations with modules](relations/modules) | Your tables relate to a module's tables, such as the signed-in user. | A `UserProfile` attached to an `AuthUser`. |

Whatever the shape, [Referential actions](relations/referential-actions) control what happens to related rows when the row they point to is deleted or its id changes.

## Related

- [Relation queries](relation-queries): fetch, attach, and detach related rows.
- [Filtering](filtering#relation-operations): filter on related rows, such as their count or contents.
- [Tables](tables): how models map to tables in the first place.
