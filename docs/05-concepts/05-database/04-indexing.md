# Indexing

For performance reasons, you may want to add indexes to your database tables. You add these in the yaml-files defining the serializable objects. Give the index a name 

```yaml
class: Company
table: company
fields:
  name: String
indexes:
  company_name_idx:
    fields: name
```

The `fields` key holds a comma-separated list of column names which  create an index on several fields

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

The key `unique` is a bool that can toggle the index to be unique, the default is set to false.

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

In addition, it's possible to add a type key to specify the index type, default is `btree`. All [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html) are available, `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`.

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
