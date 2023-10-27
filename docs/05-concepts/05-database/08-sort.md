# Sort

It is often desirable to order the results of a database query. The find method contains an orderBy parameter, to which you can pass a column to order by. The static t field on your serializable objects includes a reference to a representation of your table. It has a field for each column.

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.name,
);
```

By default the order is set to ascending this can be changed to descending by setting the param `orderDecending: true`

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.name,
  orderDescending: true,
);
```

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

## Sort on relations

To sort based on a field from a related entity, use the chained field reference. In the example below, the companies are ordered by their CEO's name:

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.ceo.name,
);
```

You can order results based on the count of list relations (1:n). For instance, sorting companies by the number of employees can be done as shown below:

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.employees.count(),
);
```

The count can also be filtered with a condition. In the next example, the companies are sorted by the number of employees with the role of 'developer':

```dart
var companies = await Company.db.find(
  session,
  orderBy: Company.t.employees.count(
    (employee) => employee.role.equals('developer'),
  ),
);
```
