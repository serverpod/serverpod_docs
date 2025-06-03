# Filter

Serverpod makes it easy to build expressions that are statically type-checked. Columns and relational fields are referenced using table descriptor objects. The table descriptors, `t`, are accessible from each model and are passed as an argument to a model specific expression builder function. A callback is then used as argument to the `where` parameter when fetching data from the database.

## Column operations

The following column operations are supported in Serverpod, each column datatype supports a different set of operations that make sense for that type.

:::info
When using the operators, it's a good practice to place them within a set of parentheses as the precedence rules are not always what would be expected.
:::

### Equals

Compare a column to an exact value, meaning only rows that match exactly will remain in the result.

```dart
await User.db.find(
  where: (t) => t.name.equals('Alice')
);
```

In the example we fetch all users with the name Alice.

Not equals is the negated version of equals.

```dart
await User.db.find(
  session,
  where: (t) => t.name.notEquals('Bob')
);
```

In the example we fetch all users with a name that is not Bob. If a non-`null` value is used as an argument for the notEquals comparison, rows with a `null` value in the column will be included in the result.

### Comparison operators

Compare a column to a value, these operators are support for `int`, `double`, `Duration`, and `DateTime`.

```dart
await User.db.find(
  session,
  where: (t) => t.age > 25
);
```

In the example we fetch all users that are older than 25 years old.

```dart
await User.db.find(
  session,
  where: (t) => t.age >= 25
);
```

In the example we fetch users that are 25 years old or older.

```dart
await User.db.find(
  session,
  where: (t) => t.age < 25
);
```

In the example we fetch all users that are younger than 25 years old.

```dart
await User.db.find(
  session,
  where: (t) => t.age <= 25
);
```

In the example we fetch all users that are 25 years old or younger.

### Between

The between method takes two values and checks if the columns value is between the two input variables _inclusively_.

```dart
await User.db.find(
  session,
  where: (t) => t.age.between(18, 65)
);
```

In the example we fetch all users between 18 and 65 years old. This can also be expressed as `(t.age >= 18) & (t.age <= 65)`.

The 'not between' operation functions similarly to 'between' but it negates the condition. It also works inclusively with the boundaries.

```dart
await User.db.find(
  session,
  where: (t) => t.age.notBetween(18, 65)
);
```

In the example we fetch all users that are not between 18 and 65 years old. This can also be expressed as `(t.age < 18) | (t.age > 65)`.

### In set

In set can be used to match with several values at once. This method functions the same as equals but for multiple values, `inSet` will make an exact comparison.

```dart
await User.db.find(
  session,
  where: (t) => t.name.inSet({'Alice', 'Bob'})
);
```

In the example we fetch all users with a name matching either Alice or Bob. If an empty set is used as an argument for the inSet comparison, no rows will be included in the result.

The 'not in set' operation functions similarly to `inSet`, but it negates the condition.

```dart
await User.db.find(
  session,
  where: (t) => t.name.notInSet({'Alice', 'Bob'})
);
```

In the example we fetch all users with a name not matching Alice or Bob. Rows with a `null` value in the column will be included in the result. If an empty set is used as an argument for the notInSet comparison, all rows will be included in the result.

### Like

Like can be used to perform match searches against `String` entries in the database, this matcher is case-sensitive. This is useful when matching against partial entries.

Two special characters enables matching against partial entries.

- **`%`** Matching any sequence of character.
- **`_`** Matching any single character.

| String |  Matcher | Is matching |
| ------ | -------- | ----------- |
| abc    |  a%      | true        |
|  abc   | \_b%     | true        |
| abc    | a_c      | true        |
| abc    | b\_      | false       |

We use like to match against a partial string.

```dart
await User.db.find(
  session,
  where: (t) => t.name.like('A%')
);
```

In the example we fetch all users with a name that starts with A.

There is a negated version of like that can be used to exclude rows from the result.

```dart
await User.db.find(
  session,
  where: (t) => t.name.notLike('B%')
);
```

In the example we fetch all users with a name that does not start with B.

### ilike

`ilike` works the same as `like` but is case-insensitive.

```dart
await User.db.find(
  session,
  where: (t) => t.name.ilike('a%')
);
```

In the example we fetch all users with a name that starts with a or A.

There is a negated version of `ilike` that can be used to exclude rows from the result.

```dart
await User.db.find(
  session,
  where: (t) => t.name.notIlike('b%')
);
```

In the example we fetch all users with a name that does not start with b or B.

### Logical operators

Logical operators are also supported when filtering, allowing you to chain multiple statements together to create more complex queries.

The `&` operator is used to chain two statements together with an `and` operation.

```dart
await User.db.find(
  session,
  where: (t) => (t.name.equals('Alice') & (t.age > 25))
);
```

In the example we fetch all users with the name "Alice" _and_ are older than 25.

The `|` operator is used to chain two statements together with an `or` operation.

```dart
await User.db.find(
  session,
  where: (t) => (t.name.like('A%') | t.name.like('B%'))
);
```

In the example we fetch all users that has a name that starts with A _or_ B.

### Vector distance operators

Vector fields support specialized distance operations for similarity search. Available vector distance operations:

- `distanceL2` - Euclidean (L2) distance.
- `distanceInnerProduct` - Inner product distance.
- `distanceCosine` - Cosine distance.
- `distanceL1` - Manhattan or taxicab (L1) distance.

You can use vector distance operations with numeric comparisons for filtering and ordering:

```dart
// The vector to compare against
var queryVector = Vector([0.1, 0.2, 0.3, ...]);

// Find top documents similar to a query vector
var similarDocs = await Document.db.find(
  session,
  where: (t) => t.embedding.distanceCosine(queryVector) < 0.5,
  orderBy: (t) => t.embedding.distanceCosine(queryVector),
  limit: 10,
);

// Filter by distance range
var mediumSimilarity = await Document.db.find(
  session,
  where: (t) => t.embedding.distanceL2(queryVector).between(0.3, 0.8),
);

// Combine with other filters
var filteredSimilarity = await Document.db.find(
  session,
  where: (t) => t.category.equals('article') &
                (t.embedding.distanceCosine(queryVector) < 0.7),
  orderBy: (t) => t.embedding.distanceCosine(queryVector),
  limit: 10,
);
```

:::tip
For optimal performance with vector similarity searches, consider creating specialized vector indexes (HNSW or IVFFLAT) on your vector fields. See the [Vector indexes](indexing#vector-indexes) section for more details.
:::

## Relation operations

If a relation between two models is defined a [one-to-one](relations/one-to-one) or [one-to-many](relations/one-to-many) object relation, then relation operations are supported in Serverpod.

### One-to-one

For 1:1 relations the columns of the relation can be accessed directly on the relation field. This enables filtering on related objects properties.

```dart
await User.db.find(
  session,
  where: (t) => t.address.street.like('%road%')
);
```

In the example each user has a relation to an address that has a street field. Using relation operations we then fetch all users where the related address has a street that contains the word "road".

### One-to-many

For 1:n relations, there are special filter methods where you can create sub-filters on all the related data. With them, you can answer questions on the aggregated result on many relations.

#### Count

Count can be used to count the number of related entries in a 1:n relation. The `count` always needs to be compared with a static value.

```dart
await User.db.find(
  session,
  where: (t) => t.orders.count() > 3
);
```

In the example we fetch all users with more than three orders.

We can apply a sub-filter to the `count` operator filter the related entries before they are counted.

```dart
await User.db.find(
  session,
  where: (t) => t.orders.count((o) => o.itemType.equals('book')) > 3
);
```

In the example we fetch all users with more than three "book" orders.

#### None

None can be used to retrieve rows that have no related entries in a 1:n relation. Meaning if there exists a related entry then the row is omitted from the result. The operation is useful if you want to ensure that a many relation does not contain any related rows.

```dart
await User.db.find(
  session,
  where: (t) => t.orders.none()
);
```

In the example we fetch all users that have no orders.

We can apply a sub-filter to the `none` operator to filter the related entries. Meaning if there is a match in the sub-filter the row will be omitted from the result.

```dart
await User.db.find(
  session,
  where:((t) => t.orders.none((o) => o.itemType.equals('book')))
);
```

In the example we fetch all users that have no "book" orders.

#### Any

Any works similarly to the `any` method on lists in Dart. If there exists any related entry then include the row in the result.

```dart
await User.db.find(
  session,
  where: (t) => t.orders.any()
);
```

In the example we fetch all users that have any order.

We can apply a sub-filter to the `any` operator to filter the related entries. Meaning if there is a match in the sub-filter the row will be included in the result.

```dart
await User.db.find(
  session,
  where:((t) => t.orders.any((o) => o.itemType.equals('book')))
);
```

In the example we fetch all users that have any "book" order.

#### Every

Every works similarly to the `every` method on lists in Dart. If every related entry matches the sub-filter then include the row in the result. For the `every` operator the sub-filter is mandatory.

```dart
await User.db.find(
  session,
  where: (t) => t.orders.every((o) => o.itemType.equals('book'))
);
```

In the example we fetch all users that have only "book" orders.
