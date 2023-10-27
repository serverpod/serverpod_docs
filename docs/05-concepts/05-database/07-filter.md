# Filter

Serverpod makes it easy to build expressions that are statically type-checked. Columns and relational fields are referenced using the global table descriptor objects. The table descriptors, t are passed to the expression builder function `where`.

## Column operations

The following column operations are supported in Serverpod, each column datatype supports a different set of operations that make sense for that type.

:::info
When using the operators, it's a good practice to place them within a set of parentheses as the precedence rules are not always what would be expected.
:::

### Equals

Compare a column to an exact value, meaning only rows that match exactly will remain in the result.

```dart
// Find all users with the name Alice
await User.db.find(
  where((t) => t.name.equals('Alice'))
);
```

Not equals is the negated version of equals.

```dart
// Find all users with a name that is not Bob
await User.db.find(
  where((t) => t.name.notEquals('Bob'))
);
```

### Comparison operators

Compare a column to a value, these operators are support for `int`, `double`, `Duration`, `DateTime` and `Enum`.

```dart
// Find all users that are older than 25 years old.
await User.db.find(
  where((t) => t.age > 25)
);
```

```dart
// Find all users that are 25 years old or older.
await User.db.find(
  where((t) => t.age >= 25)
);
```

```dart
// Find all users that are younger than 25 years old.
await User.db.find(
  where((t) => t.age < 25)
);
```

```dart
// Find all users that are 25 years old or younger.
await User.db.find(
  where((t) => t.age <= 25)
);
```

### Between

The between method takes two values and checks if the columns value is between the two input variables *inclusive*.

```dart
// Find all users between 18 and 65 years old. (>= 18 && 65 <=)
await User.db.find(
  where((t) => t.age.between(18, 65))
);
```

Not between works the same but negated and is also inclusive.

```dart
// Find all users that are not between 18 and 65 years old. (< 18 && 65 >)
await User.db.find(
  where((t) => t.age.notBetween(18, 65))
);
```

### In set

In set can be used to match with several values at once. This method function the same as equals but for multiple values, in set will make an exact comparison.

```dart
// Find all users with a name matching either Alice or Bob
await User.db.find(
  where((t) => t.name.inSet({'Alice', 'Bob'}))
);
```

```dart
// Find all users with a name not matching Alice or Bob
await User.db.find(
  where((t) => t.name.notInSet({'Alice', 'Bob'}))
);
```

### Like

Like can be used to perform match searches against String entries in the database, this matcher is case-sensitive. This is useful when matching against partial entries. Two special characters can be used to match against different values!

```dart
// Find all users with a name that starts with A
await User.db.find(
  where((t) => t.name.like('A%'))
);
```

```dart
// Find all users with a name that does not start with B
await User.db.find(
  where((t) => t.name.notLike('B%'))
);
```

- **`%`** Matching any sequence of character.
- **`_`** Matching any single character.

| String | Matcher | Is matching |
|--|--|--|
| abc | a% | true |
| abc | _b% | true |
| abc | a_c | true |
| abc | b_ | false |

### iLike

iLike works the same as `like` but is case-insensitive.

```dart
// Find all users with a name that starts with a or A
await User.db.find(
  where((t) => t.name.iLike('a%'))
);
```

```dart
// Find all users with a name that does not start with b or B
await User.db.find(
  where((t) => t.name.notIlike('b%'))
);
```

### Logical operators

The `&` and `|` operators can be used to chain two statements to perform an `and` / `or` boolean operation.

```dart
// Find all users with the name "Alice" _and_ are older than 25.
await User.db.find(
  where((t) => (t.name.equals('Alice') & (t.age > 25)))
);
```

```dart
// Find all users that has a name that starts with A _or_ B
await User.db.find(
  where((t) => (t.name.like('A%') | t.name.like('B%')))
);
```

## Relation operations

The following relational operations are supported in Serverpod.

### 1:1

On 1:1 relation all the normal operations can be accessed by simply accessing the relation field. Imagine the user has a relation to an address that has a street. Then the user can be filtered on the street like so:

```dart
// Find all users where the address has a street that contains the word "road".
await User.db.find(
  where:((t) => t.address.street.like('%road%'))
);
```

### 1:n

On 1:n relations, there are special filter methods where you can create sub-filters on all the related data. With them, you can answer questions on the aggregated result on many relations.

#### Count

Count the number of entries that match the sub-filter, the `count` always needs to be compared with a static value.

```dart
// Find all users with more than 3 book orders.
await User.db.find(
  where:((t) => t.orders.count((o) => o.itemType.equals('book')) > 3)
);
```

#### None

None is useful if you want to ensure that a many relation does not contain any related row matching your sub-filter. Meaning if there is a match in the sub-filter the parent row will be omitted from the result.

```dart
// Find all users that have no book orders.
await User.db.find(
  where:((t) => t.orders.none((o) => o.itemType.equals('book')))
);
```

#### Any

Any works similarly to the `any` method on arrays in Dart. If any related row matches the sub-filter then include the parent row.

```dart
// Find all users that have any number of book orders.
await User.db.find(
  where:((t) => t.orders.any((o) => o.itemType.equals('book')))
);
```

#### Every

Every works similarly to the `every` method on arrays in Dart. If every related row matches the sub-filter then include the parent row.

```dart
// Find all users that have only book orders.
await User.db.find(
  where:((t) => t.orders.every((o) => o.itemType.equals('book')))
);
```
