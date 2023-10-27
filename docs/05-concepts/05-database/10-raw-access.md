# Raw access

Sometimes more advanced tasks need to be performed on the database. For those occasions, it's possible to run raw SQL queries on the database.

Use the `unsafeQuery` method when querying for simple data. A `List<List<dynamic>>` will be returned with rows and columns, useful if you want a simple result without joining any data.

```dart
PostgreSQLResult result = await session.db.unsafeQuery(
  'SELECT * FROM mytable WHERE id = 1',
);
```

Use the `unsafeQueryMappedResults` method when making complex queries with joins. A `List<Map<String, Map<String, dynamic>>>` will be returned, where the first `Map`s keys is the table name where the value is another `Map` that represents each row. The key in the second `Map` is the column name and the value is the content of the column.

```dart
List<Map<String, Map<String, dynamic>>> result = await session.db.unsafeQueryMappedResults(
  'SELECT * FROM mytable LEFT JOIN othertable ON mytable.id = othertable.mytableid',
);
```

Use the `unsafeExecute` method when no result is needed. The return value represents the number of rows that changed.

```dart
int result = await session.db.unsafeExecute(
  'DELETE FROM mytable WHERE id = 1',
);
```

:::danger
Always sanitize your input when using the raw query methods, otherwise, this becomes an attack vector for SQL injections.
:::
