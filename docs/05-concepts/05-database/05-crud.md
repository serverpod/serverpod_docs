# CRUD

To interact with the database you need a [session](../sessions) object as this object holds the connection to the database. All CRUD operations are accessible via the session object and the generated models. The methods can be found under the static field `db` in models or via the session object under the field `dbNext`.

The recommended way to interact with the database is via the generated models.

For the following examples we will use this model:

```yaml
class: Company
table: company
fields:
  name: String
```

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

This operation either returns the model or `null`.

### Finding a single row

You can find a single row using an expression.

```dart
var company = await Company.db.findRow(
  session,
  where: (t) => t.name.equals('Serverpod'),
);
```

This operation returns the first model matching the filtering criteria or `null`. See [filter and sort](/concepts/database/filter-and-sort) for all filter operations.

:::info
Note that ordering of the entries is important here as it will return the fist row returned by the database query.
:::

### Finding multiple rows

To find multiple rows, use the same principle as for finding a single row. 

```dart
var companies = await Company.db.find(
  session,
  where: (t) => t.id < 100,
  limit 50,
);
```

This operation returns a `List` of your models matching the filtering criteria.

See [filter](/concepts/database/filter) and [sort](/concepts/database/sort) for all filter and sorting operations and [pagination](/concepts/database/pagination) for how to paginate the result.

## Update
There are two update operations available.

### Update a single row
To update a single row, use the `updateRow` method. 

```dart
var company = await Company.db.findById(session, companyId); // Fetched company has its id set 
company.name = 'New name';
var updatedCompany = await Company.db.updateRow(company);
```

The object that you update must have its `id` set to a non-`null` value and the id needs to exist on a row in the database. The `updateRow` method returns the updated object.

### Update several rows
To batch update several rows use the `update` method.

```dart
var companies = await Company.db.find(session);
companies = companies.map((c) => c.copyWith(name: 'New name'));
var updatedCompanies = await Company.db.update(session, companies);
```

This is an atomic operation, meaning no entries will be updated if any entry fails to be updated. The `update` method returns a `List` of the updated objects.

## Delete

Deleting rows from the database is done in a similar way as updating rows. However, there are three delete operations available.

### Delete a single row
To delete a single row, use the `deleteRow` method. 

```dart
var company = await Company.db.findById(session, companyId); // Fetched company has its id set 
var id = await Company.db.deleteRow(session, company);
```
The input object needs to have the `id` field set. The `deleteRow` method returns the `id` of the deleted row.

### Delete several rows
To batch delete several rows, use the `delete` method. 

```dart
var ids = await Company.db.delete(session, companies);
```

This is an atomic operation, meaning no entries will be deleted if any entry fails to be deleted. The `delete` method returns a `List` of the `id`s of the deleted row(s).

### Delete by filter
You can also do a [filtered](/concepts/database/filter) delete and delete all entries matching a `where` query, by using the `deleteWhere` method.

```dart
var ids = await Company.db.deleteWhere(
  session,
  where: (t) => t.name.like('%Ltd'),
);
```

The above example will delete any row that ends in *Ltd*. The `deleteWhere` method returns a `List` of the `id`s of the deleted row(s).

## Count

Count is a special type of query that helps counting the number of rows in the database that matches a specific [filter](/concepts/database/filter).

```dart
var count = await Company.db.count(
  session, 
  where: (t) => t.name.like('s%'),
);
```

The return value is an `int` for the number of rows matching the filter.

## Via session

Similarly, all operations that exist on the generated models can also be accessed via the session object.

```dart
await session.dbNext.insertRow<Company>(company);
await session.dbNext.find<Company>(where: Company.t.name.equals('Serverpod'));
await session.dbNext.updateRow<Company>(company);
...
```
