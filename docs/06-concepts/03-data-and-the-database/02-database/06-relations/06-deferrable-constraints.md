---
description: Deferrable foreign key constraints move the constraint check from the end of each statement to the end of the transaction, so rows can be written in any order.
---

# Deferrable constraints

The database checks a foreign key at the end of every statement. Insert a child row before its parent exists and that statement fails, even when the parent is inserted a line later in the same transaction. Marking the relation as deferrable moves the check to the end of the transaction, so the rows only need to line up by the time it commits.

This is what makes circular references between two tables writable: with a per-statement check, neither row can be written first.

## Declare a deferrable relation

Add `deferrable` or `deferred` to the relation on the side that holds the foreign key:

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
  companyId: int, relation(parent=company, deferrable)
```

| Keyword | Constraint | Checked |
| --- | --- | --- |
| `deferrable` | `DEFERRABLE INITIALLY IMMEDIATE` | After each statement, unless the transaction defers it. |
| `deferred` | `DEFERRABLE INITIALLY DEFERRED` | At commit. |

The two keywords are mutually exclusive. Without either one the constraint is not deferrable and cannot be deferred at runtime.

Both work on [id relations](one-to-one#with-an-id-field) and [object relations](one-to-one#with-an-object). Like `onUpdate` and `onDelete`, they can only be set on the side holding the foreign key:

```yaml
# employee.yaml
class: Employee
table: employee
fields:
  name: String
  company: Company?, relation(deferred)
```

Adding, changing, or removing the keyword changes the constraint in the database, so run `serverpod create-migration` afterwards.

## Defer the check in a transaction

A `deferred` relation is checked at commit already, so ordinary transactions can write the rows in any order:

```dart
await session.db.transaction((transaction) async {
  await Employee.db.insertRow(session, employee, transaction: transaction);
  await Company.db.insertRow(session, company, transaction: transaction);
});
```

A `deferrable` relation keeps the per-statement check until a transaction asks for it to be deferred. Set `deferConstraints` in the [transaction settings](../transactions) to defer every deferrable constraint for the duration of the transaction:

```dart
await session.db.transaction(
  (transaction) async {
    await Employee.db.insertRow(session, employee, transaction: transaction);
    await Company.db.insertRow(session, company, transaction: transaction);
  },
  settings: TransactionSettings(deferConstraints: true),
);
```

Either way the constraint is still enforced. If the parent row is missing when the transaction commits, the commit fails with a `DatabaseQueryException` and the whole transaction is rolled back.

:::note
On SQLite the `deferConstraints` setting defers every foreign key check in the transaction, whether or not the relation is declared deferrable. On PostgreSQL only constraints declared with `deferrable` or `deferred` can be deferred.
:::

## Related

- [Referential actions](referential-actions): what happens to related rows when the row they point to is deleted or its id changes.
- [Transactions](../transactions): isolation levels, savepoints, and rollback.
