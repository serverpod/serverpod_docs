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

### Modified return type for unsafeQueryMappedResults(...)
The return type for `unsafeQueryMappedResults(...)` has been modified to better comply with the return type from the underlying database. The return type is now a list of maps, where each map contains the query alias for the column as key and the row-column value as value.

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

The return type in 1.2 was:
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

And now becomes:

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

 the result in 1.2 was:

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

 and now becomes:

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

