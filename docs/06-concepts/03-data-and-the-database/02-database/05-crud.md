---
description: The generated db methods on each model class create, read, update, and delete database rows in Serverpod.
---

# CRUD

To interact with the database you need a [`Session`](../../endpoints-and-apis/sessions) object as this object holds the connection to the database. All CRUD operations are accessible via the session object and the generated models. The methods can be found under the static `db` field in your generated models.

For the following examples we will use this model:

```yaml
class: Company
table: company
fields:
  name: String, unique
  address: String?
  employeeCount: int, default=0
  isActive: bool, default=true
```

:::note

You can also access the database methods through the session object under the field `db`. However, this is typically only recommended if you want to do custom queries where you explicitly type out your SQL queries.

:::

## Create

There are two ways to create a new row in the database.

### Inserting a single row

Inserting a single row to the database is done by calling the `insertRow` method on your generated model. The method will return the entire company object with the `id` field set.

```dart
var row = Company(name: 'Serverpod');
var company = await Company.db.insertRow(session, row);
```

### Inserting several rows

Inserting several rows in a batch operation is done by calling the `insert` method. This is an atomic operation, meaning no entries will be created if any entry fails to be created.

```dart
var rows = [Company(name: 'Serverpod'), Company(name: 'Google')];
var companies = await Company.db.insert(session, rows);
```

### Ignoring conflicts

When inserting rows that might violate a unique or exclusion constraint, you can set `ignoreConflicts` to `true` on the `insert` method. Rows that would cause a unique or exclusion constraint violation are silently skipped, and only the non-conflicting rows are inserted.

```dart
var rows = [Company(name: 'Serverpod'), Company(name: 'Google')];
var inserted = await Company.db.insert(session, rows, ignoreConflicts: true);
```

The method returns only the rows that were successfully inserted. If all rows conflict, an empty list is returned. Unlike a regular `insert`, which fails entirely if any row violates a constraint, `ignoreConflicts` allows partial inserts where only the non-conflicting rows are written.

This is useful for idempotent operations where you want to insert data without failing on duplicates. Only unique and exclusion constraint violations are ignored. Other violations such as `NOT NULL`, `CHECK`, or foreign key constraints still throw an exception.

:::warning
When using `ignoreConflicts` with models that have [non-persistent fields](./tables#non-persistent-fields), each row is inserted individually instead of in a single batch. This is necessary because the database cannot report which rows were skipped in a batch insert, making it impossible to correctly match non-persistent field values back to inserted rows. For large numbers of rows, this can cause performance issues. Consider removing non-persistent fields from the model or inserting in smaller batches.
:::

## Upsert

An upsert inserts a row, or updates the row that is already there when the insert would violate a unique constraint. The database runs the check and the write as a single atomic operation, so no other transaction can slip in between them.

### Upserting a single row

Call `upsertRow` to upsert one row. The `conflictColumns` parameter names the columns that decide whether a row already exists, and those columns must be covered by a unique constraint or unique index. In the example model, `name` is unique.

```dart
var company = await Company.db.upsertRow(
  session,
  Company(name: 'Serverpod', employeeCount: 42),
  conflictColumns: (t) => [t.name],
);
```

If no company named `Serverpod` exists, a new row is inserted. Otherwise the existing row keeps its `id` and its remaining persistent columns are overwritten with the values from the supplied object. By default every persistent column is updated except `id` and the columns listed in `conflictColumns`.

The `id` column can be the conflict target as well, which is useful when the same code path handles an object that may or may not already have an id.

```dart
var company = await Company.db.upsertRow(
  session,
  Company(id: companyId, name: 'Serverpod', employeeCount: 42),
  conflictColumns: (t) => [t.id],
);
```

### Choosing which columns to update

Pass `updateColumns` to limit which columns change when a conflict occurs.

```dart
var company = await Company.db.upsertRow(
  session,
  Company(name: 'Serverpod', employeeCount: 42),
  conflictColumns: (t) => [t.name],
  updateColumns: (t) => [t.employeeCount],
);
```

A new row is still inserted with all of its persistent values. An existing row only has its `employeeCount` updated.

Pass `updateWhere` to update a conflicting row only when the row already in the database matches a [filter](./filtering).

```dart
var company = await Company.db.upsertRow(
  session,
  Company(name: 'Serverpod', employeeCount: 42),
  conflictColumns: (t) => [t.name],
  updateWhere: (t) => t.isActive.equals(true),
);
```

This is why `upsertRow` returns a nullable value. When a row conflicts but does not match `updateWhere`, it is left untouched and the method returns `null`.

### Upserting several rows

Call `upsert` to insert or update several rows in a batch.

```dart
var companies = await Company.db.upsert(
  session,
  [
    Company(name: 'Serverpod', employeeCount: 42),
    Company(name: 'Example Ltd', employeeCount: 12),
  ],
  conflictColumns: (t) => [t.name],
);
```

This is an atomic operation, meaning no rows are written if any row fails. Pass a [transaction](./transactions) with the `transaction` parameter to make it part of a larger unit of work.

The batch method takes the same `updateColumns` and `updateWhere` parameters as `upsertRow`. Rows rejected by `updateWhere` are left out of the result, so the returned list can be shorter than the input. Set `noReturn` to `true` to write the rows without reading them back.

For models with [non-persistent fields](./tables#non-persistent-fields), the input values of those fields are carried over to the returned objects. They take no part in conflict detection and are never written to the database.

## Read

There are three different read operations available.

### Finding by id

You can retrieve a single row by its `id`.

```dart
var company = await Company.db.findById(session, companyId);
```

This operation either returns the model or `null`.

### Finding a single row

You can find a single row using an expression.

```dart
var company = await Company.db.findFirstRow(
  session,
  where: (t) => t.name.equals('Serverpod'),
);
```

This operation returns the first model matching the filtering criteria or `null`. See [filter](./filtering) and [sort](./sorting) for all filter operations.

:::info
If you include an `orderBy`, it will be evaluated before the list is reduced. In this case, `findFirstRow()` will return the first entry from the sorted list.
:::

### Finding multiple rows

To find multiple rows, use the same principle as for finding a single row.

```dart
var companies = await Company.db.find(
  session,
  where: (t) => t.id < 100,
  limit: 50,
);
```

This operation returns a `List` of your models matching the filtering criteria.

See [filter](./filtering) and [sort](./sorting) for all filter and sorting operations and [pagination](pagination) for how to paginate the result.

## Update

There are multiple update operations available for different use cases.

### Update a single row

To update a single row, use the `updateRow` method.

```dart
var company = await Company.db.findById(session, companyId); // Fetched company has its id set
company.name = 'New name';
var updatedCompany = await Company.db.updateRow(session, company);
```

The object that you update must have its `id` set to a non-`null` value and the id needs to exist on a row in the database. The `updateRow` method returns the updated object.

#### Update specific columns

It is possible to target one or several columns that you want to mutate, meaning any other column will be left unmodified even if the dart object has introduced a change.

```dart
var company = await Company.db.findById(session, companyId);
company.name = 'New name';
company.address = 'Baker street';
var updatedCompany = await Company.db.updateRow(session, company, columns: (t) => [t.name]);
```

In the above example, only the company name will be updated, the address column will not be changed.

### Update several rows

To batch update several rows use the `update` method.

```dart
var companies = await Company.db.find(session);
companies = companies.map((c) => c.copyWith(name: 'New name')).toList();
var updatedCompanies = await Company.db.update(session, companies);
```

This is an atomic operation, meaning no entries will be updated if any entry fails to be updated. The `update` method returns a `List` of the updated objects.

#### Update specific columns

The same syntax is available for updating specific columns on multiple rows.

```dart
var companies = await Company.db.find(session);
companies = companies.map((c) => c.copyWith(name: 'New name', address: 'Baker Street')).toList();
var updatedCompanies = await Company.db.update(session, companies, columns: (t) => [t.name]);
```

### Update by ID

To update a row by its ID without fetching it first, use the `updateById` method. This method allows you to specify which columns to update directly.

```dart
var updatedCompany = await Company.db.updateById(
  session,
  companyId,
  columnValues: (t) => [t.name('New name'), t.address('New address')],
);
```

The `updateById` method updates only the specified columns for the row with the given ID. The method returns the updated row, or throws a `DatabaseUpdateRowException` if no row with the given ID exists. At least one column must be specified in the `columnValues` parameter, otherwise an `ArgumentError` will be thrown.

See [Database exceptions](./exceptions) for the full set of database exception types and when they are thrown.

You can also update columns to null values:

```dart
var updatedCompany = await Company.db.updateById(
  session,
  companyId,
  columnValues: (t) => [t.name(null), t.address(null)],
);
```

### Update where

To update rows based on filter criteria, use the `updateWhere` method. This method allows you to update specific columns for all rows matching a where clause.

```dart
var updatedCompanies = await Company.db.updateWhere(
  session,
  columnValues: (t) => [t.name('Updated name')],
  where: (t) => t.name.like('%Ltd'),
);
```

The `updateWhere` method updates all rows matching the where expression, modifying only the specified columns. The method returns a list of the updated rows. If no rows match the criteria, an empty list is returned. See [filter](./filtering) for all available filtering operations.

The method also supports [pagination](pagination) and [ordering](./sorting):

```dart
var updatedCompanies = await Company.db.updateWhere(
  session,
  columnValues: (t) => [t.name('Updated name'), t.address('New address')],
  where: (t) => t.id > 100,
  orderBy: (t) => t.id, // or t.id.asc()
  limit: 10,
  offset: 5,
);
```

## Delete

Deleting rows from the database is done in a similar way to updating rows. However, there are three delete operations available.

### Delete a single row

To delete a single row, use the `deleteRow` method.

```dart
var company = await Company.db.findById(session, companyId); // Fetched company has its id set
var companyDeleted = await Company.db.deleteRow(session, company);
```

The input object needs to have the `id` field set. The `deleteRow` method returns the deleted model.

### Delete several rows

To batch delete several rows, use the `delete` method. This method also supports [ordering](./sorting) the returned deleted results.

```dart
var companiesDeleted = await Company.db.delete(
  session,
  companies,
  orderBy: (t) => t.id, // or t.id.asc()
);
```

This is an atomic operation, meaning no entries will be deleted if any entry fails to be deleted. The `delete` method returns a `List` of the models deleted, ordered as specified by the orderBy.

### Delete by filter

You can also do a [filtered](./filtering) delete and delete all entries matching a `where` query, by using the `deleteWhere` method. This method also supports [ordering](./sorting) of the returned deleted results.

```dart
var companiesDeleted = await Company.db.deleteWhere(
  session,
  where: (t) => t.name.like('%Ltd'),
  orderByList: (t) => [t.name.desc(), t.id.asc()],
);
```

The above example will delete any row where the `name` ends in _Ltd_. The `deleteWhere` method returns a `List` of the models deleted, ordered by name in descending order, followed by id in ascending order.

## Count

Count is a special type of query that helps counting the number of rows in the database that matches a specific [filter](./filtering).

```dart
var count = await Company.db.count(
  session,
  where: (t) => t.name.like('s%'),
);
```

The return value is an `int` for the number of rows matching the filter.
