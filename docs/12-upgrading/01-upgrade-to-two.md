# Upgrade to 2.0

## Changes to the Session Object

With Serverpod 2.0, we have removed the deprecated legacy database layer from the `Session` object. The `Session` object now incorporates the new database layer, accessed via the `dbNext` field in Serverpod 1.2, under the `db` field.

```dart
session.dbNext.find(...);
```

becomes

```dart
session.db.find(...);
```

## Changes to database queries

### Removed unsafeQueryMappedResults(...)
The `unsafeQueryMappedResults(...)` method has been removed. A similar result can now instead be formatted from the `unsafeQuery(...)` result by calling the `toColumnMap()` method for each row of the result. `toColumnMap` returns a map containing the query alias for the column as key and the row-column value as value.

Given a query that performs a join like this:
```sql
SELECT
 "company"."id" AS "company.id",
 "company"."name" AS "company.name",
 "company"."townId" AS "company.townId",
 "company_town_town"."id" AS "company_town_town.id",
 "company_town_town"."name" AS "company_town_town.name",
 "company_town_town"."mayorId" AS "company_town_town.mayorId"
FROM
 "company"
LEFT JOIN
 "town" AS "company_town_town" ON "company"."townId" = "company_town_town"."id"
ORDER BY
 "company"."name"
```

The return type from `unsafeQueryMappedResults(...)` in 1.2 was:
```json
[
  {
    "company": {
      "company.id": 40,
      "company.name": "Apple",
      "company.townId": 64
    },
    "town": {
      "company_town_town.id": 64,
      "company_town_town.name": "San Francisco",
      "company_town_town.mayorId": null
    }
  },
  {
    "company": {
      "company.id": 39,
      "company.name": "Serverpod",
      "company.townId": 63
    },
    "town": {
      "company_town_town.id": 63,
      "company_town_town.name": "Stockholm",
      "company_town_town.mayorId": null
    }
  }
]
```

And if `result.map((row) => row.toColumnMap())` is used to format the result from `unsafeQuery(...)` in 2.0, the following result is obtained: 

```json
[
  {
    "company.id": 38,
    "company.name": "Apple",
    "company.townId": 62,
    "company_town_town.id": 62,
    "company_town_town.name": "San Francisco",
    "company_town_town.mayorId": null
  },
  {
    "company.id": 37,
    "company.name": "Serverpod",
    "company.townId": 61,
    "company_town_town.id": 61,
    "company_town_town.name": "Stockholm",
    "company_town_town.mayorId": null
  }
]
```

or for a simple query without aliases:
```sql
SELECT
 "id",
 "name",
 "townId"
FROM
 "company"
ORDER BY
 "name"
```

the return type from `unsafeQueryMappedResults(...)` in 1.2 was:

```json
[
  {
    "company": {
      "id": 54,
      "name": "Apple",
      "townId": 86
    }
  },
  {
    "company": {
      "id": 53,
      "name": "Serverpod",
      "townId": 85
    }
  }
]
```

and if `result.map((row) => row.toColumnMap())` is used to format the result from `unsafeQuery(...)` in 2.0, the following result is obtained: 

```json
 [
  {
    "id": 54,
    "name": "Apple",
    "townId": 86
  },
  {
    "id": 53,
    "name": "Serverpod",
    "townId": 85
  }
]
```

## Changes to database tables

### Integer representation changed to bigint
Integer representation in the database has changed from `int` to `bigint`. From now on, models with `int` fields will generate database migrations where that field is defined as a `bigint` type in the database.

This change also applies to the `id` field of models where `bigserial` is now used to generate the id.

The change is compatible with existing databases. Existing migrations therefore, won't be changed by the Serverpod migration system. No manual modification to the database is required if this data representation is not essential for the application. However, all new migrations will be created with the new representation.

#### Why is this change made?
The change was made to ensure that [Dart](https://dart.dev/guides/language/numbers) and the database representation of integers is consistent. Dart uses 64-bit integers, and the `int` type in Dart is a 64-bit integer. The `int` type in PostgreSQL is a 32-bit integer. This means that the `int` type in Dart can represent larger numbers than the `int` type in PostgreSQL. By using `bigint` in PostgreSQL, the integer representation is consistent between Dart and the database.

In terms of performance, there are usually no significant drawbacks with using `bigint` instead of `int`. In most cases a good index strategy will be more important than the integer representation. Here is a guide that benchmarks the performance of `int` and `bigint` in PostgreSQL: (Use BIGINT in Postgres)[https://blog.rustprooflabs.com/2021/06/postgres-bigint-by-default]

#### Ensuring new databases are created with the new representation
Since existing migrations won't be changed, databases that are created with these will still use `int` to represent integers. 

To ensure new databases are created with the new representation, the latest migration should be generated using Serverpod 2.0. It is enough to have an empty migration to ensure new databases use the new representation.

A new empty migration can be created by running the following command in the terminal:

```bash
$ serverpod create-migration --force
```

#### Migration of existing tables
The migration of existing tables to use the new representation will vary depending on the database content. Utilizing the wrong migration strategy might cause downtime for your application. That is the reason Serverpod does not automatically migrate existing tables.

##### Small tables
A simple way to migrate for small tables is to execute the following sql query to the database:

```sql
ALTER SEQUENCE "my_table_id_seq" AS bigint;
ALTER TABLE "my_table" ALTER "id" TYPE bigint;
ALTER TABLE "my_table" ALTER "myNumber" TYPE bigint;
```

The first two lines modify the id sequence for a table named `"my_table"` to use `bigint` instead of `int`. The last line modifies a column of the same table to use `bigint`. The drawback of this approach is that it locks the table during the migration. Therefore, this strategy is not recommended for large tables.

##### Large tables
Migrating large tables without application downtime is a more complex operation, and the approach will vary depending on the data structure. Below are some gathered resources on the subject.

- (Zemata - Column migration from INT to BIGINT)[http://zemanta.github.io/2021/08/25/column-migration-from-int-to-bigint-in-postgresql/]
- (AM^2 - Changing a column from int to bigint, without downtime)[https://am2.co/2019/12/changing-a-column-from-int-to-bigint-without-downtime/]
- (Crunch data - The integer at the End of the Universe)[https://www.crunchydata.com/blog/the-integer-at-the-end-of-the-universe-integer-overflow-in-postgres]

## Changes in the authentication module

### Unsecure random disabled by default
The authentication module's default value for allowing unsecure random number generation is now `false`. An exception will be thrown when trying to hash a password if no secure random number generator is available. To preserve the old behavior and enable unsecure random number generation, set the `allowUnsecureRandom` property in the `AuthConfig` to `true`.

```dart
auth.AuthConfig.set(auth.AuthConfig(
  allowUnsecureRandom: true,
));
```