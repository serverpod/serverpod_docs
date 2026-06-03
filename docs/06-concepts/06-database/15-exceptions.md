# Database exceptions

Serverpod wraps database failures in exceptions that implement `DatabaseException`.
This gives you one common type to catch for database failures and more specific
types when you want to handle a known operation failure.

```dart
try {
  await Company.db.updateById(
    session,
    companyId,
    columnValues: (t) => [t.name('New name')],
  );
} on DatabaseUpdateRowException {
  // No row with the provided id was updated.
} on DatabaseQueryException catch (e) {
  session.log(
    'Database query failed with code ${e.code}',
    exception: e,
  );
} on DatabaseException catch (e) {
  session.log('Database operation failed', exception: e);
}
```

When a database exception is not caught inside an endpoint, it follows
Serverpod's normal endpoint exception handling and is logged as an uncaught
server exception. Database exceptions are not serializable exceptions sent to
the client with their database details.

## Exception types

| Exception | When it is thrown |
| --- | --- |
| `DatabaseException` | The common interface for database exceptions. Catch this when you want one handler for any database failure. |
| `DatabaseQueryException` | A query failed in the database adapter, often because the database rejected the SQL or a constraint was violated. |
| `DatabaseInsertRowException` | A single-row insert operation did not insert exactly one row. |
| `DatabaseUpdateRowException` | A single-row update operation did not update the expected row, for example when `updateById` receives an id that does not exist. |
| `DatabaseDeleteRowException` | A single-row delete operation did not delete the expected row. |
| `DatabaseUpsertRowException` | A single-row upsert operation unexpectedly returned more than one row. |
| `SqliteForeignKeyViolationException` | A SQLite foreign key integrity check found one or more violating rows. |

## Query exception details

`DatabaseQueryException` exposes optional fields from the underlying database
adapter. These fields are useful for logging and for handling known database
errors:

- `code`
- `detail`
- `hint`
- `tableName`
- `columnName`
- `constraintName`
- `position`

For example, PostgreSQL constraint errors can include a database error code and
the violated constraint name. These values are database-adapter details, so
write defensive code that handles `null` values.

```dart
try {
  await Company.db.insertRow(session, company);
} on DatabaseQueryException catch (e) {
  if (e.constraintName == 'company_name_key') {
    // Handle a duplicate company name here.
    return;
  }

  // Let unexpected database query errors keep their original stack trace.
  rethrow;
}
```

## Operation exceptions

The row-level operation exceptions describe cases where Serverpod expected one
row to be affected but the database result did not match that expectation. For
example, `updateById` throws a `DatabaseUpdateRowException` when no row exists
for the id you pass in.

Batch and filtered operations have their own documented behavior. Some methods,
such as `updateWhere` or `deleteWhere`, can validly affect zero rows and return
an empty list instead of throwing a row-level exception.

## SQLite foreign key checks

When using the client-side SQLite database, Serverpod can run a SQLite foreign
key integrity check when it verifies database integrity, such as after applying
migrations in debug mode. If SQLite reports invalid foreign key references,
Serverpod throws `SqliteForeignKeyViolationException`. The exception contains
the violating rows returned by SQLite's `PRAGMA foreign_key_check`.
