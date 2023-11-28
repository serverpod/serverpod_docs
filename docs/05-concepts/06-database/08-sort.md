# Sort

It is often desirable to order the results of a database query. The 'find' method features an 'orderBy' parameter where you can specify a column for sorting. In your model, the static `t` field provides a reference to a representation of the database table associated with the model, and this representation includes a field corresponding to each column.

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.name,
);
```

In the example we fetch all companies and sort them by their name.

By default the order is set to ascending, this can be changed to descending by setting the param `orderDecending: true`.

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.name,
  orderDescending: true,
);
```

In the example we fetch all companies and sort them by their name in descending order.

To order by several different columns use `orderByList`, note that this cannot be used in conjunction with `orderBy` and `orderDescending`.

```dart
var companies = await Company.db.find(
  session,
  orderByList: [
    Order(column: Company.t.name, orderDescending: true), 
    Order(column: Company.t.id),
  ],
);
```

In the example we fetch all companies and sort them by their name in descending order, and then by their id in ascending order.

## Sort on relations

To sort based on a field from a related entity, use the chained field reference.

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.ceo.name,
);
```

In the example we fetch all companies and sort them by their CEO's name.

You can order results based on the count of a list relation (1:n).

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.employees.count(),
);
```

In the example we fetch all companies and sort them by the number of employees.

The count used for sorting can also be filtered using a sub-filter.

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.employees.count(
    (employee) => employee.role.equals('developer'),
  ),
);
```

In the example we fetch all companies and sort them by the number of employees with the role of "developer".
