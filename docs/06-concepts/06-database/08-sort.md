---
description: Sort database query results by one or more columns in Serverpod using orderBy and orderByList, with support for relational fields and aggregated counts.
---

# Sort

It is often desirable to order the results of a database query. The 'find' method has an `orderBy` parameter where you can specify a column for sorting. The parameter takes a callback as an argument that passes a model-specific table descriptor, also accessible through the `t` field on the model. The table descriptor represents the database table associated with the model and includes fields for each corresponding column. The callback is then used to specify the column to sort by.

```dart
var companies = await Company.db.find(
  session,
  orderBy: (t) => t.name,
);
```

In the example we fetch all companies and sort them by their name.

By default, results are sorted in ascending order. To sort in descending order, call `.desc()` on the column:

```dart
var companies = await Company.db.find(
  session,
  orderBy: (t) => t.name.desc(),
);
```

In the example we fetch all companies and sort them by their name in descending order.

To order by several different columns use `orderByList`, note that this cannot be used in conjunction with `orderBy`.

```dart
var companies = await Company.db.find(
  session,
  orderByList: (t) => [t.name.desc(), t.id.asc()],
);
```

In the example we fetch all companies and sort them by their name in descending order, and then by their id in ascending order.

## Sort on relations

To sort based on a field from a related model, use the chained field reference.

```dart
var companies = await Company.db.find(
  session,
  orderBy: (t) => t.ceo.name,
);
```

In the example we fetch all companies and sort them by their CEO's name.

You can order results based on the count of a list relation (1:n).

```dart
var companies = await Company.db.find(
  session,
  orderBy: (t) => t.employees.count(),
);
```

In the example we fetch all companies and sort them by the number of employees.

The count used for sorting can also be filtered using a sub-filter.

```dart
var companies = await Company.db.find(
  session,
  orderBy: (t) => t.employees.count(
    (employee) => employee.role.equals('developer'),
  ),
);
```

In the example we fetch all companies and sort them by the number of employees with the role of "developer".
