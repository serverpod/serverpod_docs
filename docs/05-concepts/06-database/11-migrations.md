# Migrations
Serverpod comes bundled with a simple-to-use but powerful migration system that helps you keep your database schema up to date as your project evolves. Database migrations provide a structured way of upgrading your database while maintaining existing data.

A migration is a set of database operations (e.g. creating a table, adding a column, etc.) required to update the database schema to match the requirements of the project. Each migration handles both initializing a new database and rolling an existing one forward from a previous state.

If you ever get out of sync with the migration system, repair migrations can be used to bring the database schema up to date with the migration system. Repair migrations identify the differences between the two and create a unique migration that brings the live database schema in sync with a migration database schema.

## Opt out of migrations

It is possible to selectively opt out of the migration system per table basis, by setting the `managedMigration` key to false in your model. When this flag is set to false the generated migrations will not define any SQL code for this table. You will instead have to manually define and manage the life cycle of this table.

```yaml
class: Example
table: example
managedMigration: false
fields:
  name: String
```

If you want to transition a manually managed table to then be managed by Serverpod you first need to set this flag to `true`. Then you have two options, either delete the old table you had created by yourself, and this will let Serverpod manage the schema from a clean state. However, this means that you would lose any data that was stored in the table. The second option is to make sure that the table schema matches the expected schema you have configured. This can be done by either manually making sure the schema aligns, or by creating a [repair migration](#creating-a-repair-migration) to get back into the correct state.

## Creating a migration

To create a migration navigate to your project's `server` package directory and run the `create-migration` command.

```bash
$ serverpod create-migration
```

The command reads the database schema from the last migration, then compares it to the database schema necessary to accommodate the projects, and any module dependencies, current database requirements. If differences are identified, a new migration is created in the `generated/migration/migrations` directory to roll the database forward.

If no previous migration exists it will create a migration assuming there is no initial state.

See the [Pre-migration project upgrade path](../../upgrading/upgrade-to-one-point-two) section for more information on how to get started with migrations for any project created before migrations were introduced in Serverpod.

### Force create migration
The migration command aborts and displays an error under two conditions:
1. When no changes are identified between the database schema in the latest migration and the schema required by the project.
2. When there is a risk of data loss.

To override these safeguards and force the creation of a migration, use the `--force` flag.

```bash
$ serverpod create-migration --force
```

### Tag migration

Tags can be useful to identify migrations that introduced specific changes to the project. Tags are appended to the migration name and can be added with the `--tag` option.

```bash
$ serverpod create-migration --tag "v1-0-0"
```

This would create a migration named `<timestamp>-v1-0-0`:

```
├── migrations
│    └── 20231205080937028-v1-0-0
```

### Add data in a migration
Since the migrations are written in SQL, it is possible to add data to the database in a migration. This can be useful if you want to add initial data to the database.

The developer is responsible for ensuring that any added SQL statements are compatible with the database schema and rolling forward from the previous migrations.

### Migrations directory structure

The `migrations` directory contains a folder for each migration that is created, looking like this for a project with two migrations:

```
├── migrations
│    ├── 20231205080937028
│    ├── 20231205081959122
│    └── migration_registry.txt 
```

Every migration is denoted by a directory labeled with a timestamp indicating when the migration was generated. Within the directory, there is a `migration_registry.txt` file. This file is automatically created whenever migrations are generated and serves the purpose of cataloging the migrations. Its primary function is to identify migration conflicts.


For each migration, five files are created:

- **definition.json** - Contains the complete definition of the database schema, including any database schema changes from Serverpod module dependencies. This file is parsed by the Serverpod CLI to determine the target database schema for the migration.
- **definition.sql** - Contains SQL statements to create the complete database schema. This file is applied when initializing a new database.
- **definition_project.json** - Contains the definition of the database schema for only your project. This file is parsed by the Serverpod CLI to determine what tables are different by Serverpod modules.
- **migration.json** - Contains the actions that are part of the migration. This file is parsed by the Serverpod CLI.
- **migration.sql** - Contains SQL statements to update the database schema from the last migration to the current version. This file is applied when rolling the database forward.

## Apply migrations
Migrations are applied using the server runtime. To apply migrations, navigate to your project's `server` package directory, then start the server with the `--apply-migrations` flag. Migrations are applied as part of the startup sequence and the framework asserts that each migration is only applied once to the database.

```bash
$ dart run bin/main.dart --apply-migrations
```

Migrations can also be applied using the maintenance role. In maintenance, after migrations are applied, the server exits with an exit code indicating if migrations were successfully applied, zero for success or non-zero for failure.


```bash
$ dart run bin/main.dart --role maintenance --apply-migrations
```

This is useful if migrations are applied as part of an automated process.

If migrations are applied at the same time as repair migration, the repair migration is applied first.

## Creating a repair migration

If the database has been manually modified the database schema may be out of sync with the migration system. In this case, a repair migration can be created to bring the database schema up to date with the migration system.

By default, the command connects to and pulls a live database schema from a running development server.

To create a repair migration, navigate to your project's `server` package directory and run the `create-repair-migration` command.

```bash
$ serverpod create-repair-migration
```

This creates a repair migration in the `generated/migration/repair` directory targeting the project's latest migration.

A repair migration is represented by a single SQL file that contains the SQL statements necessary to bring the database schema up to date with the migration system.

Since each repair migration is created for a specific live database schema, Serverpod will overwrite the latest repair migration each time a new repair migration is created.

### Migration database source
By default, the repair migration system connects to your `development` database using the information specified in your Serverpod config. To use a different database source, the `--mode` option is used.

```bash
$ serverpod create-migration --mode production
```

The command connects and pulls the live database schema from a running server. 

### Targeting a specific migration
Repair migrations can also target a specific migration version by specifying the migration name with the `--version` option.

```bash
$ serverpod create-repair-migration --version 20230821135718-v1-0-0
```

This makes it possible to revert your database schema back to any older migration version. 

### Force create repair migration
The repair migration command aborts and displays an error under two conditions:
1. When no changes are identified between the database schema in the latest migration and the schema required by the project.
2. When there is a risk of data loss.

To override these safeguards and force the creation of a repair migration, use the `--force` flag.

```bash
$ serverpod create-repair-migration --force
```

### Tag repair migration
Repair migrations can be tagged just as regular migrations. Tags are appended to the migration name and can be added with the `--tag` option.

```bash
$ serverpod create-repair-migration --tag "reset-migrations"
```

This would create a repair migration named `<timestamp>-reset-migrations` in the `repair` directory:

```
├── repair
│    └── 20230821135718-v1-0-0.sql
```

### Repair migrations directory structure

The `repair` directory only exists if a repair migration has been created and contains a single SQL file containing statements to repair the database schema.

```
├── repair
│    └── 20230821135718-v1-0-0.sql
```

## Applying a repair migration
The repair migration is applied using the server runtime. To apply a repair migration, start the server with the `--apply-repair-migration` flag. The repair migration is applied as part of the startup sequence and the framework asserts that each repair migration is only applied once to the database.

```bash
$ dart run bin/main.dart --apply-repair-migration
```

The repair migration can also be applied using the maintenance role. In maintenance, after migrations are applied, the server exits with an exit code indicating if migrations were successfully applied, zero for success or non-zero for failure.


```bash
$ dart run bin/main.dart --role maintenance --apply-repair-migration
```

If a repair migration is applied at the same time as migrations, the repair migration is applied first.

## Rolling back migrations
Utilizing repair migrations it is easy to roll back the project to any migration. This is useful if you want to revert the database schema to a previous state. To roll back to a previous migration, create a repair migration targeting the migration you want to roll back to, then apply the repair migration.

Note that data is not rolled back, only the database schema.

