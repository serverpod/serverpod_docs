# Models

It's possible to map serializable models to tables in your database. To do this, add the `table` key to your yaml file:

```yaml
class: Company
table: company
fields:
  name: String
```

When the `table` keyword is added to the model, the `serverpod generate` command will generate new methods for [interacting](crud) with the database. The addition of the keyword will also be detected by the `serverpod create-migration` command that will generate the necessary [migrations](migrations) needed to update the database.

:::info

When you add a `table` to a serializable class, Serverpod will automatically add an `id` field of type `int?` to the class. You should not define this field yourself. The `id` is set when you interact with an object stored in the database.

:::

## Non persistent fields

You can opt out of creating a column in the database for a specific field by using the `!persist` keyword.

```yaml
class: Company
table: company
fields:
  name: String, !persist
```

All fields are persisted by default and have an implicit `persist` set on each field.

## Data representation

Storing a field with a primitive / core dart type will be handled as its respective type. However, if you use a complex type, such as another model, a `List`, or a `Map`, these will be stored as a `json` column in the database by default.

```yaml
class: Company
table: company
fields:
  address: Address # Stored as a json column
```

This means that each row has its own copy of the nested object that needs to be updated individually. If you instead want to reference the same object from multiple different tables, you can use the `relation` keyword.

This creates a database relation between two tables and always keeps the data in sync.

```yaml
class: Company
table: company
fields:
  address: Address?, relation
```

For a complete guide on how to work with relations see the [relation section](relations/one-to-one).

### Storing fields as JSONB

By default, complex types are stored as `json` in PostgreSQL. You can opt into `jsonb` storage instead using the `serializationDataType` keyword. JSONB is a binary format that supports efficient querying and [GIN indexing](indexing#gin-indexes).

You can set `serializationDataType` at three levels, each overriding the one above it:

#### Field level

Applies to a single field:

```yaml
class: Product
table: product
fields:
  tags: List<String>, serializationDataType=jsonb
  metadata: Map<String, String>, serializationDataType=jsonb
```

#### Class level

Applies to all serializable fields in the class:

```yaml
class: Product
table: product
serializationDataType: jsonb
fields:
  tags: List<String> # Stored as jsonb
  metadata: Map<String, String> # Stored as jsonb
  name: String # Not affected — primitive types are not serialized
```

Individual fields can still override the class-level setting:

```yaml
class: Product
table: product
serializationDataType: jsonb
fields:
  tags: List<String> # jsonb (from class)
  metadata: Map<String, String>, serializationDataType=json # json (field override)
```

#### Project level

Applies to all models in the project. Add this to your `config/generator.yaml`:

```yaml
serialize_as_jsonb_by_default: true
```

When enabled, all serializable fields across all models default to `jsonb` unless overridden at the class or field level.

:::info
The `serializationDataType` keyword is only valid on serializable field types (models, Lists, Maps). Primitive types like `String` and `int` have their own native database column types and are not affected by this setting.
:::

The three levels follow a **field > class > project** precedence: a field-level setting always wins over class-level, and class-level always wins over project-level. If no level specifies a value, the default is `json`.

## Change ID type

Changing the type of the `id` field allows you to customize the identifier type for your database tables. This is done by declaring the `id` field on table models with one of the supported types. If the field is omitted, the id field will still be created with type `int`, as have always been.

The following types are supported for the `id` field:

| **Type**      | Default | Default Persist options | Default Model options | Description            |
| :------------ | :------ | :---------------------- | :-------------------- | :--------------------- |
| **int**       | serial  | serial (optional)       | -                     | 64-bit serial integer. |
| **UuidValue** | random  | random                  | random                | UUID v4 value.         |

### Declaring a Custom ID Type

To declare a custom type for the `id` field in a table model file, use the following syntax:

```yaml
class: UuidIdTable
table: uuid_id_table
fields:
  id: UuidValue?, defaultPersist=random
```

```yaml
class: IntIdTable
table: int_id_table
fields:
  id: int?, defaultPersist=serial  // The default keyword for 'int' is optional.
```

#### Default Uuid model value

For UUIDs, it is possible to configure the `defaultModel` value. This will ensure that UUIDs are generated as soon as the object is created, rather than when it is persisted to the database. This is useful for creating objects offline or using them before they are sent to the server.

```yaml
class: UuidIdTable
table: uuid_id_table
fields:
  id: UuidValue, defaultModel=random
```

When using `defaultModel=random`, the UUID will be generated when the object is created. Since an id is always assigned the `id` field can be non-nullable.
