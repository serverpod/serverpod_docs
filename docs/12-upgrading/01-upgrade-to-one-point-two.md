# Upgrade to 1.2

Serverpod 1.2 introduces database migrations, a new way to handle database schema changes. This greatly simplifies the process of upgrading your database schema.

## Dart version

This update has bumped the minimum required dart version to `3.0.0`. You will have to change the Dart SDK version in all your `pubspec.yaml` files, the server, flutter and client projects.

Old pubspec.yaml configuration.

```yaml
...
environment:
  sdk: '>=2.19.0 <4.0.0'
```

Updated pubspec.yaml configuration.

```yaml
...
environment:
  sdk: '>=3.0.0 <4.0.0'
```

The `Dockerfile` in your project also has to be updated with the new dart version you want to run.

```docker
FROM dart:3.0 AS build

...
```

## Deprecated methods

All database methods generated on your serializable classes have been deprecated and replaced with corresponding methods on a static `db` field on the same class.
Most methods have just moved location, but some have slightly different implementations.

```dart
// The new find method is a drop-in replacement.
Example.find(...); // old
Example.db.find(...); // new

// The old findSingleRow method has changed name to findFirstRow but is otherwise a drop-in replacement.
Example.findSingleRow(...);
Example.db.findFirstRow(...);

// The new findById method is a drop-in replacement.
Example.findById(...); // old
Example.db.findById(...); // new

// The old delete method has been renamed to deleteWhere and now returns a list of ids of rows that was deleted.
Example.delete(...);
Example.db.deleteWhere(...);

// The new findById method is a drop-in replacement but returns the id of the row deleted.
Example.deleteRow(...); // old
Example.db.deleteRow(...); // new

// The old update method has been renamed too updateRow and now returns the entire updated object as a new copy.
Example.update(...);
Example.db.updateRow(...);

// The old insert method has been renamed too insertRow. The object you pass in is no longer modified, instead a new copy with the added row is returned which contains the inserted id. This means no mutations of the input object.
Example.insert(...);
Example.db.insertRow(...);

// The new count method is a drop-in replacement.
Example.count(...);
Example.db.count(...);
```

## Model changes

The keyword `api` has been deprecated and replaced with the new keyword `!persist` as a drop-in replacement.

Old syntax:

```yaml
class: Example
table: example
fields:
  name: String
  apiField: String, api
```

New syntax:

```yaml
class: Example
table: example
fields:
  name: String
  apiField: String, !persist
```

The keyword `database` has been deprecated and replaced with the new keyword `scope` with the value `serverOnly` as a drop-in replacement.

Old syntax:

```yaml
class: Example
table: example
fields:
  name: String
  serverField: String, database
```

New syntax:

```yaml
class: Example
table: example
fields:
  name: String
  serverField: String, scope=serverOnly
```

The keyword `parent` has been moved and should be placed inside the new `relation` keyword, see the section on [relations](../concepts/database/relations/one-to-one) for the full new feature set.

Old syntax:

```yaml
class: Example
table: example
fields:
  name: String
  parentId: int, parent=example
```

New Syntax:

```yaml
class: Example
table: example
fields:
  name: String
  parentId: int, relation(parent=example)
```

## Moved and renamed SQL file

Serverpod has moved and renamed the generated SQL file for the complete database schema. Instead of the file `generated/tables.pgsql`, Serverpod now includes it as a part of each migration located in `generated/migration/migrations`, under the name `definition.sql`.

## Initialize migration system

If your project was created before migrations were introduced in Serverpod, you need to run a one-time setup to make it compatible with the migrations system. There are two guides to help you upgrade: one for projects that don't need to preserve any data and another for those that do.

The guides assume that you have already installed Serverpod 1.2 and that you have a project created with an earlier version of Serverpod.

### No data to preserve

If it is not important to preserve the data that is in your database, you can simply remove the database and let the migration system create a new one.

1. Generate the project.

This ensures that the project is up to date with the latest version of Serverpod. Navigate to your project's `server` package directory and run the `generate` command.

```bash
$ serverpod generate
```

2. Create a migration for your project.

The migration system will create a migration as if the database needs to be initialized from scratch. Navigate to your project's `server` package directory and run the `create-migration` command.

```bash
$ serverpod create-migration
```

3. Recreate database.

In a Serverpod development project, the database is hosted in a docker container. To remove the existing database and start a new one run the following commands:

```bash
$ docker-compose down -v
$ docker-compose up --build --detach 
```

The command first removes the running container along with its volume and the second command starts a new database from scratch.

4. Initialize database from migration.

Initialize the database by applying the migration to it using the `--apply-migrations` flag when starting the server.

```bash
$ dart run bin/main.dart --apply-migrations
```

### Data to preserve

If your project already has data in the database that should be preserved, we can use the repair migration system to bring the project up to date with the migration system.

1. Generate the project.

This ensures that the project is up to date with the latest version of Serverpod. Navigate to your project's `server` package directory and run the `generate` command.

```bash
$ serverpod generate
```

2. Create a migration for your project.

The migration system will create a migration as if the database needs to be initialized from scratch. Navigate to your project's `server` package directory and run the `create-migration` command.

```bash
$ serverpod create-migration
```

3. Create a repair migration.

The repair migration system will create a repair migration that makes your live database schema match the newly created migration. Navigate to your project's `server` package directory and run the `create-repair-migration` command.

```bash
$ serverpod create-repair-migration
```

Use the `--mode` option to specify the database source to use. By default, the repair migration system connects to your `development` database using the information specified in your Serverpod config.

4. Apply the repair migration to your database.

Apply the repair migration to your database using the `--apply-repair-migration` flag when starting the server.

```bash
$ dart run bin/main.dart --apply-repair-migration
```

## Closing remarks

Your project is now compatible with the database migration system in Serverpod 1.2.

Happy coding!
