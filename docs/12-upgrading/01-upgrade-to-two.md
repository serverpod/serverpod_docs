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

