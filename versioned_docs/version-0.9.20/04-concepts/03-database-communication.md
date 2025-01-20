# Database communication
Serverpod makes it easy to communicate with your database using strictly typed objects without a single SQL line. But, if you need to do more complex tasks, you can always do direct SQL calls. You define your database mappings right in the protocol yaml files.

## Database mappings
It's possible to map serializable classes straight to tables in your database. To do this, add the `table` key to your yaml file:

```yaml
class: Company
table: company
fields:
  name: String
  foundedDate: DateTime?
```

When running `serverpod generate`, the database schema will be saved in the `generated/tables.pgsql` file. You can use this to create the corresponding database tables.

:::info

When you add a `table` to a serializable class, Serverpod will automatically add an `id` field of type `int?` to the class. You should not define this field yourself. The `id` is set when you insert or select a row from the database. The `id` field allows you to do updates and reference the rows from other objects and tables.

:::

### Field scopes
In some cases, you want to save a field to the database, but it should never be sent to the server. You can exclude it from the protocol by adding the `database` scope to the type.

```yaml
class: UserData
fields:
  name: String
  password: String?, database
```

Likewise, if you only want a field to be accessible in the protocol but not stored in the server, you can add the `api` flag. By default, a field is accessible to both the API and the database.

:::info

If you use the `database` or `api` options the field must be nullable.

:::

### Database indexes
For performance reasons, you may want to add indexes to your database tables. You add these in the YAML-files defining the serializable objects.

```yaml
class: Company
table: company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>?, api
indexes:
  company_name_idx:
    fields: name
```

The `fields` key holds a comma-separated list of column names. In addition, it's possible to add a type key (default is `btree`), and a `unique` key (default is `false`).

### Parent/child relationships
With a field's parent property, you can define a relationship with a table's parent table. This relationship ensures that the parent id is always valid and that if you delete the referenced parent, the referencing row will automatically be deleted.

The employee's `parent` is set to the `company` table in the example below. If you remove the company, all employees of the company will automatically be removed. When you insert the employee into the database, you must specify a valid `companyId` that corresponds to the id field in the `company` table.

```yaml
class: Employee
table: employee
fields:
  companyId: int, parent=company
  name: String
  birthday: DateTime
```

### Storing objects or references
If you reference another serializable object in your yaml file, it will be stored as a JSON entry in the database. This creates a copy of that object. In many cases, this is not desirable. Instead, you may want to reference that object by an id from another table. See the section on [joining tables and nesting objects](#joining-tables-and-nesting-objects) below for more information.

In the example below, a list of employees is stored as a JSON structure for each company in the database. A better solution would be to create a database row for each employee and reference the company. However, there are cases where it is convenient to store whole JSON structures in each row.

```yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee> # Stored as JSON structure
```

## Making queries
For the communication to work, you need to have generated serializable classes with the `table` key set, and the corresponding table must have been created in the database.

### Inserting a table row
Insert a new row in the database by calling the insert method of the `db` field in your `Session` object.

```dart
var myRow = Company(name: 'Serverpod corp.', employees: []);
await Company.insert(session, myRow);
```

After the object has been inserted, it's `id` field is set from its row in the database.

### Finding a single row
You can find a single row, either by its `id` or using an expression. You need to pass a reference to the a session in the call. Tables are accessible through generated serializable classes.

```dart
var myCompany = await Company.findById(session, companyId);
```

If no matching row is found, `null` is returned. You can also search for rows using expressions with the `where` parameter. The `where` parameter is a typed expression builder. The builder's parameter, `t`, contains a description of the table which gives access to the table's columns.

```dart
var myCompany = await Company.findSingleRow(
  session,
  where: (t) => t.name.equals('My Company'),
);
```

### Finding multiple rows
To find multiple rows, use the same principle as for finding a single row. Returned will be a `List` of `TableRow`s.

```dart
var companies = await Company.find(
  tCompany,
  where: (t) => t.id < 100,
  limit: 50,
);
```
### Updating a row
To update a row, use the `update` method. The object that you update must have its `id` set to a non-`null` value.

```dart
var myCompany = await session.db.findById(tCompany, companyId) as Company?;
myCompany.name = 'New name';
await session.db.update(myCompany);
```

### Deleting rows
Deleting a single row works similarly to the `update` method, but you can also delete rows using the where parameter.

```dart
// Delete a single row
await Company.deleteRow(session, myCompany);

// Delete all rows where the company name ends with 'Ltd'
await Company.delete(
  where: (t) => t.name.like('%Ltd'),
);
```

### Creating expressions
To find or delete specific rows, most often, expressions are needed. Serverpod makes it easy to build expressions that are statically type-checked. Columns are referenced using the global table descriptor objects. The table descriptors, `t` are passed to the expression builder function. The `>`, `>=`, `<`, `<=`, `&`, and `|` operators are overridden to make it easier to work with column values. When using the operators, it's a good practice to place them within a set of parentheses as the precedence rules are not always what would be expected. These are some examples of expressions.

```dart
// The name column of the Company table equals 'My company')
t.name.equals('My company')

// Companies founded at or after 2020
t.foundedDate >= DateTime.utc(2020)

// Companies with number of employees between 10 and 100
(t.numEmployees > 10) & (t.numEmployees <= 100)

// Companies that has the founded date set
t.foundedDate.notEquals(null)
```

### Joining tables and nesting objects
Serverpod does not yet support joins automatically. However, you can easily create nested objects by performing two or more queries.

For instance, if you have a `Company` object with a list of `Employee` it can be declared like this:

```yaml
# company.yaml
class: Company
table: company
fields:
  name: String
  employees: List<Employee>?, api

# employee.yaml
class: Employee
table: employee
fields:
  companyId: int
  name: String
  birthday: DateTime
```

This prevents the list of `Employee` to be automatically fetched or stored in the database. After you fetch a `Company` object from the database, format it by fetching the list of `Employees`.

```dart
var company = await Company.findById(session, id);

var employees = await Employee.find(
  session,
  where: (t) => t.companyId.equals(company.id),
);

company.employees = employees;
```

:::info

Future versions of Serverpod will add support for automatic joins and database views.

:::

### Transactions
The essential point of a database transaction is that it bundles multiple steps into a single, all-or-nothing operation. The intermediate states between the steps are not visible to other concurrent transactions, and if some failure occurs that prevents the transaction from completing, then none of the steps affect the database at all.

Serverpod handles database transactions through the `session.db.transaction` method. The transaction takes a method that performs any database queries or other operations and optionally returns a value.

```dart
var result = await session.db.transaction((transaction) async {
  // Do some database queries here.

  // Optionally return a value.
  return true;
});
```

### Executing raw queries
Sometimes more advanced tasks need to be performed on the database. For those occasions, it's possible to run raw SQL queries on the database. Use the `query` method. A `List<List<dynamic>>` will be returned with rows and columns.

```dart
var result = await session.db.query('SELECT * FROM mytable WHERE ...');
```
