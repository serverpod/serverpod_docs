# Models

It's possible to map serializable classes straight to tables in your database. To do this, add the `table` key to your yaml file:

```yaml
class: Company
table: company
fields:
  name: String
```

When the `table` keyword is added to the model, the `serverpod generate` command will generate new methods for [interacting](crud) with the database. The addition of the keyword will also be detected by the `serverpod migrate` command that will generate the necessary [migrations](migrations) needed to update the database.

:::info

When you add a `table` to a serializable class, Serverpod will automatically add an `id` field of type `int?` to the class. You should not define this field yourself. The `id` is set when you interact with an object stored in the database.

:::

### Non persistent fields
You can opt out of creating a column in the database for a specific field by using the `!persist` keyword. 

```yaml
class: Company
table: company
fields:
  name: String, !persist 
```
All fields are persisted by default and have an implicit `persist` set on each field.

### Data representation
Storing a field with a primitive / core dart type will be handled as the their respective type. But if you use a complex type, such as another model, a `list` or a `map` these will be stored as a `json` object in the database.

```yaml
class: Company
table: company
fields:
  company: Company # Stored as a json column
```

This means that each row has its own copy of the nested object that needs to be updated individually. If you instead want to reference the same object from multiple different tables, you can use the `relation` keyword.

This creates a database relation between two tables and always keeps the data in sync.

```yaml
class: Company
table: company
fields:
  company: Company, relation
```

For a complete guide on how to work with relations see the [relation section](relations/one-to-one).
