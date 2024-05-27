# Raw access

Sometimes more advanced tasks need to be performed on the database. For those occasions, it's possible to run raw SQL queries on the database.

Use the `unsafeQuery` method when querying for simple data. The method returns a `List<List<dynamic>>` with rows and columns and is useful if you want a simple result without joining any data.

```dart
PostgreSQLResult result = await session.db.unsafeQuery(
  'SELECT * FROM mytable WHERE id = 1',
);
```

Use the `unsafeQueryMappedResults` method when making complex queries with joins. The method returns a `List<Map<String, Map<String, dynamic>>>`, where the `List` contains an entry for each result row. The result row is a `Map` where the key is the table from which the data has been retrieved and the value is another `Map` of that tables columns. The column `Map` inside the table `Map` has column names as keys and the contents of the colum as values.

``` dart
[
  row {
    table {
      column: content,
    },
  },
]
```

Above is a visual aid of the data structure.

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

in the above example, the `result` variable will contain the number of rows that were deleted.

:::danger
Always sanitize your input when using the raw query methods, otherwise, this becomes an attack vector for SQL injections.
:::
