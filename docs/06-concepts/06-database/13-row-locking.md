# Row locking

Row-level locking allows you to lock specific rows in the database to prevent other transactions from modifying them while you work. This is essential for safely handling concurrent updates, such as processing payments, managing inventory, or any scenario where two transactions might conflict.

All row locking operations require a [transaction](transactions).

For the following examples we will use this model:

```yaml
class: Company
table: company
fields:
  name: String
```

## Locking rows with a read

You can lock rows as part of a read operation by passing the `lockMode` parameter to `find`, `findFirstRow`, or `findById`. The locked rows are returned and held until the transaction completes.

```dart
await session.db.transaction((transaction) async {
  var companies = await Company.db.find(
    session,
    where: (t) => t.name.equals('Serverpod'),
    lockMode: LockMode.forUpdate,
    transaction: transaction,
  );

  // Rows are locked — safe to update without conflicts.
  for (var company in companies) {
    company.name = 'Updated name';
    await Company.db.updateRow(session, company, transaction: transaction);
  }
});
```

The `findFirstRow` and `findById` methods also support locking:

```dart
await session.db.transaction((transaction) async {
  var company = await Company.db.findById(
    session,
    companyId,
    lockMode: LockMode.forUpdate,
    transaction: transaction,
  );

  if (company != null) {
    company.name = 'Updated name';
    await Company.db.updateRow(session, company, transaction: transaction);
  }
});
```

## Locking rows without fetching data

If you only need to lock rows without reading their data, use the `lockRows` method. This acquires locks with less overhead since no row data is transferred.

```dart
await session.db.transaction((transaction) async {
  await Company.db.lockRows(
    session,
    where: (t) => t.name.equals('Serverpod'),
    lockMode: LockMode.forUpdate,
    transaction: transaction,
  );

  // Rows are locked — perform updates using other methods.
});
```

## Lock modes

The `lockMode` parameter determines the type of lock acquired. Different lock modes allow varying levels of concurrent access.

| Lock Mode | Constant | Description |
|---|---|---|
| For update | `LockMode.forUpdate` | Exclusive lock that blocks all other locks. Use when you intend to update or delete the locked rows. |
| For no key update | `LockMode.forNoKeyUpdate` | Exclusive lock that allows `forKeyShare` locks. Use when updating non-key columns only. |
| For share | `LockMode.forShare` | Shared lock that blocks exclusive locks but allows other shared locks. Use when you need to ensure rows don't change while reading. |
| For key share | `LockMode.forKeyShare` | Weakest lock that only blocks changes to key columns. |

For a detailed explanation of how lock modes interact, see the [PostgreSQL documentation](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS).

## Lock behavior

The `lockBehavior` parameter controls what happens when a requested row is already locked by another transaction. If not specified, the default behavior is to wait.

| Behavior | Constant | Description |
|---|---|---|
| Wait | `LockBehavior.wait` | Wait until the lock becomes available. This is the default. |
| No wait | `LockBehavior.noWait` | Throw an exception immediately if any row is already locked. |
| Skip locked | `LockBehavior.skipLocked` | Skip rows that are currently locked and return only the unlocked rows. |

```dart
await session.db.transaction((transaction) async {
  var companies = await Company.db.find(
    session,
    where: (t) => t.id < 100,
    lockMode: LockMode.forUpdate,
    lockBehavior: LockBehavior.skipLocked,
    transaction: transaction,
  );

  // Only unlocked rows are returned.
});
```

:::info

`LockBehavior.skipLocked` is particularly useful for implementing job queues or work distribution, where multiple workers can each grab unlocked rows without waiting on each other.

:::
