# Indexing

For performance reasons, you may want to add indexes to your database tables. These are added in the yaml-files defining the serializable objects.

### Add an index

To add an index, add an `indexes` section to the yaml-file. The `indexes` section is a map where the key is the name of the index and the value is a map with the index details.

```yaml
class: Company
table: company
fields:
  name: String
indexes:
  company_name_idx:
    fields: name
```

The `fields` keyword holds a comma-separated list of column names. These are the fields upon which the index is created. Note that the index can contain several fields.

```yaml
class: Company
table: company
fields:
  name: String
  foundedAt: DateTime
indexes:
  company_idx:
    fields: name, foundedAt
```

### Making fields unique

Adding a unique index ensures that the value or combination of values stored in the fields are unique for the table. This can be useful for example if you want to make sure that no two companies have the same name.

```yaml
class: Company
table: company
fields:
  name: String
indexes:
  company_name_idx:
    fields: name
    unique: true
```

The `unique` keyword is a bool that can toggle the index to be unique, the default is set to false. If the `unique` keyword is applied to a multi-column index, the index will be unique for the combination of the fields.

### Specifying index type

It is possible to add a type key to specify the index type.

```yaml
class: Company
table: company
fields:
  name: String
indexes:
  company_name_idx:
    fields: name
    type: brin
```

If no type is specified the default is `btree`. All [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html) are supported, `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`.
