# Indexing

For performance reasons, you may want to add indexes to your database tables. These are added in the YAML-files defining the serializable objects.

## Add an index

To add an index, add an `indexes` section to the YAML-file. The `indexes` section is a map where the key is the name of the index and the value is a map with the index details.

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

## Making fields unique

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

## Specifying index type

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

## GIN indexes

GIN (Generalized Inverted Index) indexes are designed for efficiently querying composite values such as JSONB data. When all fields in an index are stored as `jsonb`, Serverpod automatically defaults the index type to `gin`:

```yaml
class: Product
table: product
fields:
  tags: List<String>, serializationDataType=jsonb
indexes:
  product_tags_idx:
    fields: tags
    # type defaults to gin since all indexed fields are jsonb
```

You can also set the type explicitly:

```yaml
indexes:
  product_tags_idx:
    fields: tags
    type: gin
```

### Operator classes

GIN indexes support different operator classes that control which query operators the index can accelerate. Use the `operatorClass` keyword to specify one:

```yaml
indexes:
  product_tags_idx:
    fields: tags
    type: gin
    operatorClass: jsonbPathOps
```

| Operator Class | Description                                        | Use Case                                                        |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| `jsonbOps`     | Default. Supports `@>`, `?`, `?\|`, `?&` operators | General-purpose JSONB querying                                  |
| `jsonbPathOps` | Supports only `@>` (containment)                   | Faster and smaller index when you only need containment queries |
| `arrayOps`     | For array containment queries                      | Array-typed columns                                             |
| `tsvectorOps`  | For full-text search                               | Text search with `tsvector` columns                             |

:::tip
If you only need containment queries (`@>`), use `jsonbPathOps` — it produces a smaller and faster index than the default `jsonbOps`.
:::

:::info
GIN indexes are a PostgreSQL feature. On SQLite, GIN index definitions are silently skipped during migration generation.
:::

For details on configuring JSONB storage on your model fields, see [Storing fields as JSONB](models#storing-fields-as-jsonb).

## Vector indexes

To enhance the performance of vector similarity search, it is possible to create specialized vector indexes on vector fields (`Vector`, `HalfVector`, `SparseVector`, `Bit`). Serverpod supports both `hnsw` and `ivfflat` index types with full parameter specification.

:::info
Each vector index can only be created on a single vector field. It is not possible to create a vector index on multiple fields of any kind.
:::

### HNSW indexes

Hierarchical Navigable Small World (HNSW) indexes provide fast approximate nearest neighbor search:

```yaml
class: Document
table: document
fields:
  content: String
  embedding: Vector(1536)
  keywords: SparseVector(10000)
  hash: Bit(256)
indexes:
  document_embedding_hnsw_idx:
    fields: embedding
    type: hnsw
    distanceFunction: cosine
    parameters:
      m: 16
      ef_construction: 64
  document_keywords_idx:
    fields: keywords
    type: hnsw
    distanceFunction: innerProduct
    parameters:
      m: 16
      ef_construction: 64
  document_hash_idx:
    fields: hash
    type: hnsw
    distanceFunction: hamming
    parameters:
      m: 16
      ef_construction: 64
```

Available HNSW parameters:

- `m`: Maximum number of bidirectional links for each node (default: 16)
- `ef_construction`: Size of the dynamic candidate list (default: 64)

### IVFFLAT indexes

Inverted File with Flat compression (IVFFLAT) indexes are suitable for large datasets:

```yaml
class: Document
table: document
fields:
  content: String
  embedding: Vector(1536)
indexes:
  document_embedding_ivfflat_idx:
    fields: embedding
    type: ivfflat
    distanceFunction: innerProduct
    parameters:
      lists: 100
```

Available IVFFLAT parameters:

- `lists`: Number of inverted lists (default: 100)

### Distance functions

Supported distance functions for vector indexes (`distanceFunction` parameter):

| Distance Function | Description                   | Use Case                     |
| ----------------- | ----------------------------- | ---------------------------- |
| `l2`              | Euclidean distance            | Default for most embeddings  |
| `innerProduct`    | Inner product                 | When vectors are normalized  |
| `cosine`          | Cosine distance               | Text embeddings              |
| `l1`              | Manhattan or taxicab distance | Sparse/high-dimensional data |
| `hamming`         | Hamming distance              | Binary vectors (Bit type)    |
| `jaccard`         | Jaccard distance              | Binary vectors (Bit type)    |

Different vector types have specific limitations when creating indexes:

- **SparseVector**: Can only use HNSW indexes (IVFFLAT is not supported).
- **HalfVector**: When using IVFFLAT indexes, the L1 distance function is not supported.
- **Bit**: Only supports `hamming` (default) and `jaccard` distance functions.

:::tip
If more than one distance function is going to be frequently used on the same vector field, consider creating one index for each distance function to ensure optimal performance.
:::

For more details on vector indexes and its configuration, refer to the [pgvector extension documentation](https://github.com/pgvector/pgvector/tree/master?tab=readme-ov-file#indexing).
