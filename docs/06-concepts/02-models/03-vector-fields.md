# Vector fields

Vector types are used for storing high-dimensional vectors, which are especially useful for similarity search operations.

When specifying vector types, the dimension is required between parentheses (e.g., `Vector(1536)`). Common dimensions include:

- 1536 (OpenAI embeddings)
- 768 (many sentence transformers)
- 384 (smaller models)

All vector types support specialized distance operations for similarity search and filtering. See the [Vector distance operators](../database/filter#vector-distance-operators) section for details.

To ensure optimal performance with vector similarity searches, consider creating specialized vector indexes on your vector fields. See the [Vector indexes](../database/indexing#vector-indexes) section for more details.

:::info
The usage of Vector fields requires the pgvector PostgreSQL extension to be installed, which comes by default on new Serverpod projects. To upgrade an existing project, see the [Upgrading to pgvector support](../../upgrading/upgrade-to-pgvector) guide.
:::

## Vector

The `Vector` type stores full-precision floating-point vectors for general-purpose embeddings.

```yaml
class: Document
table: document
fields:
  ### The category of the document (e.g., article, tutorial).
  category: String

  ### The contents of the document.
  content: String

  ### A vector field for storing document embeddings
  embedding: Vector(1536)
```

## HalfVector

The `HalfVector` type uses half-precision (16-bit) floating-point numbers, providing memory savings with acceptable precision loss for several applications.

```yaml
class: Document
table: document
fields:
  content: String
  ### Half-precision embedding for memory efficiency
  embedding: HalfVector(1536)
```

## SparseVector

The `SparseVector` type efficiently stores sparse vectors where most values are zero, which is ideal for high-dimensional data with few non-zero elements.

```yaml
class: Document
table: document
fields:
  content: String
  ### Sparse vector for keyword-based embeddings
  keywords: SparseVector(10000)
```

## Bit

The `Bit` type stores binary vectors where each element is 0 or 1, offering maximum memory efficiency for binary embeddings.

```yaml
class: Document
table: document
fields:
  content: String
  ### Binary vector for semantic hashing
  hash: Bit(256)
```
