# Working with the database

A core feature of Serverpod is to query the database easily. Serverpod provides an ORM that supports type and null safety.

## Connecting to the database

When working with the database, it is common that you want to connect to it with a database viewer such as [Postico2](https://eggerapps.at/postico2/), [PgAdmin](https://www.pgadmin.org/download/), or [DBeaver](https://dbeaver.io/download/). To connect to the database, you need to specify the host and port along with the database name, user name, and password. In your project, you can find these inside the `config` directory.

The connection details can be found in the file `config/development.yaml`. The variable `name` refers to the database name (which is your project name only).

```yaml
database:
  host: localhost
  port: 8090
  name: projectname
  user: postgres

...
```

The password can be found in the file `config/passwords.yaml`.

```yaml
development:
  database: '<MY DATABASE PASSWORD>'

...
```

## Migrations

With database migrations, Serverpod makes it easy to evolve your database schema. When you make changes to your project that should be reflected in your database, you need to create a migration. A migration is a set of SQL queries that are run to update the database. To create a migration, run `serverpod create-migration` in the home directory of the server.

```bash
$ cd mypod/mypod_server
$ serverpod create-migration
```

Migrations are then applied to the database as part of the server startup by adding the `--apply-migrations` flag.

```bash
$ cd mypod/mypod_server
$ dart bin/main.dart --apply-migrations
```

:::tip

To learn more about database migrations, see the [Migrations](../concepts/database/migrations) section.

:::

## Object database mapping

Add a `table` key to your model file to add a mapping to the database. The value specified after the key sets the database table name. Here is the `Company` class from earlier with a database table mapping to a table called `company`:

```yaml
class: Company
table: company
fields:
  name: String
  foundedDate: DateTime?
```

CRUD operations are available through the static `db` method on all classes with database bindings.

:::tip

To learn more about database CRUD operations, see the [CRUD](../concepts/database/crud) section.

:::

## Writing to database

Inserting a new row into the database is as simple as calling the static `db.insertRow` method.

```dart
var myCompany = Company(name: 'Serverpod corp.', foundedDate: DateTime.now());
myCompany = await Company.db.insertRow(session, myCompany);
```

The method returns the inserted object with its `id` field set from the database.

## Reading from database

Retrieving a single row from the database can done by calling the static `db.findById` method and providing the `id` of the row.

```dart
var myCompany = await Company.db.findById(session, companyId);
```

You can also use an expression to do a more refined search through the `db.findFirstRow(...)`. method. The `where` parameter is a typed expression builder. The builder's parameter, `t`, contains a description of the table and gives access to the table's columns.

```dart
var myCompany = await Company.db.findFirstRow(
  session,
  where: (t) => t.name.equals('My Company'),
);
```

The example above will return a single row from the database where the `name` column is equal to `My Company`.

If no matching row is found, `null` is returned.

:::tip

Working with a database is an extensive subject. Learn more in the [Database](../concepts/database/connection) section.

::: 