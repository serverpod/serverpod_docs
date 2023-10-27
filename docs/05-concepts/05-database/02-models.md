# Models

It's possible to map serializable classes straight to tables in your database. To do this, add the `table` key to your yaml file:

```yaml
class: Company
table: company
fields:
  name: String
```

When the `table` keyword is used many new methods are generated on the class when running `serverpod generate`. This keyword also notifies the `serverpod migrate` command that this table needs to be created and will then keep track of changes needed to complete database [migrations](/concepts/database/migrations).

:::info

When you add a `table` to a serializable class, Serverpod will automatically add an `id` field of type `int?` to the class. You should not define this field yourself. The `id` is set when you insert or select a row from the database. The `id` field allows you to do updates and reference the rows from other objects and tables.

:::
You can opt out of creating a column in the database for a specific field by using the `!persist` keyword. All fields are persisted by default and have an implicit `persist` set on each field.

```yaml
class: Company
table: company
fields:
  name: String, !persist 
```

Storing a primitive / core dart type will be handled as the their respective type. But if you use a complex type, such as another model or a `list` or `map` these will be stored as a `json` object in the database.

```yaml
class: Company
table: company
fields:
  company: Company # Stored as a json column
```

This means that each row has its own copy of the nested object, this may not be what you want in a situation where the same object should be referenced from multiple different tables. As you would have to update each table individually and manually keep the data in sync.

Instead you can create a database relation between two tables using the `relation` keyword.

Storing a primitive / core dart type will be handled as the their respective type. But if you use a complex type, such as another model or a `list` or `map` these will be stored as a `json` object in the database.

```yaml
class: Company
table: company
fields:
  company: Company, relation
```

For a complete guide on how to work with relations see the [relation section](/concepts/database/relations/one-to-one).
