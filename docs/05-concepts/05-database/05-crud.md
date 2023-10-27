# CRUD

To interact with the database you need a [session](/concepts/sessions) object as this object holds the connection to the database. All CRUD operations are accessible via the session object, but generated the models will also contain all database operations. All the methods can be found under the static field `db` or via the session object under the field `dbNext`.

In the following example we will use this model:

```yaml
class: Company
table: company
fields:
  name: String
```

## Create

Insert a new row in the database by calling the `insertRow` method on your generated model. The method will return the entire company object with the `id` field set.

```dart
var row = Company(name: 'Serverpod');
var company = await Company.db.insertRow(session, row);
```

Batch inserts several new rows of companies by calling the `insert` method. This is an atomic operation, meaning no entries will be created if any entry fails to be created.

```dart
var rows = [Company(name: 'Serverpod'), Company(name: 'Google')];
var companies = await Company.db.insert(session, rows);
```

:::note
In previous versions of Serverpod the `insert` method mutated the input object by setting the `id` field. In the example above the input variable remains unmodified after the `insert`/`insertRow` call.
:::

## Read

There are three different read operations available.

### Finding by id

You can retrieve a single row by its `id`.

```dart
var company = await Company.db.findById(session, companyId);
```

Returns the model or `null`.

### Finding a single row

You can find a single row using an expression.

```dart
var company = await Company.db.findRow(
  session,
  where: (t) => t.name.equals('Serverpod'),
);
```

Returns the model or `null`. See [filter and sort](/concepts/database/filter-and-sort) for all filter operations.

### Finding multiple rows

To find multiple rows, use the same principle as for finding a single row. Returned will be a `List` of your model.

```dart
var companies = await Company.db.find(
  session,
  where: (t) => t.id < 100,
  limit 50,
);
```

See [filter](/concepts/database/filter) and [sort](/concepts/database/sort) for all filter and sorting operations and [pagination](/concepts/database/pagination) for how to paginate the result.

## Update

To update a row, use the `updateRow` method. The object that you update must have its `id` set to a non-`null` value and the id needs to exist on a row in the database.

```dart
var company = await Company.db.findById(session, companyId);
company.name = 'New name';
var updatedCompany = await Company.db.updateRow(company);
```

To batch update several rows use the `update` method. This is an atomic operation, meaning no entries will be updated if any entry fails to be updated.

```dart
var companies = await Company.db.find(session);
companies = companies.map((c) => c.copyWith(name: 'New name'));
var updatedCompanies = await Company.db.update(session, companies);
```

## Delete

Deleting a single row works similarly to the `update` method. The input object needs to have the `id` field set.

```dart
var id = await Company.db.deleteRow(session, company);
```

To batch delete several rows, use the `delete` method. This is an atomic operation, meaning no entries will be deleted if any entry fails to be deleted.

```dart
var ids = await Company.db.delete(session, companies);
```

You can also do a [filtered](/concepts/database/filter) delete and delete all entries matching a `where` query, by using the `deleteWhere` method.

```dart
var ids = await Company.db.deleteWhere(
  session,
  where: (t) => t.name.like('%Ltd'),
);
```

The above example will delete any row that ends in *Ltd*.

The delete methods returns the `id` of the deleted row(s).

## Count

Count is a special type of query that helps counting the number of rows in the database that matches a specific [filter](/concepts/database/filter).

```dart
var count = await Company.db.count(
  session, 
  where: (t) => t.name.like('s%'),
);
```

## Via session

Similarly, all operations that exist on the generated models can also be accessed via the session object.

```dart
await session.dbNext.insertRow<Company>(company);
await session.dbNext.find<Company>(where: Company.t.name.equals('Serverpod'));
await session.dbNext.updateRow<Company>(company);
...
```
