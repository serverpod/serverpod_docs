---
description: Vector and geography fields store high-dimensional embeddings with pgvector and geospatial data with PostGIS in Serverpod models.
---

# Vector & geography fields

Serverpod supports two families of specialized field types backed by PostgreSQL extensions: vector fields for high-dimensional embeddings (via pgvector) and geography fields for geospatial data (via PostGIS).

## Vector fields

Vector types are used for storing high-dimensional vectors, which are especially useful for similarity search operations.

When specifying vector types, the dimension is required between parentheses (e.g., `Vector(1536)`). Common dimensions include:

- 1536 (OpenAI embeddings)
- 768 (many sentence transformers)
- 384 (smaller models)

All vector types support specialized distance operations for similarity search and filtering. See the [Vector distance operators](../database/filtering#vector-distance-operators) section for details.

To ensure optimal performance with vector similarity searches, consider creating specialized vector indexes on your vector fields. See the [Vector indexes](../database/indexing#vector-indexes) section for more details.

:::info
The usage of Vector fields requires a Postgres database with the `pgvector` extension installed. The extension comes by default on new Serverpod projects. To upgrade an existing project, see the [Upgrade to pgvector](../../../upgrading/archive/upgrade-to-pgvector) guide.
:::

### Vector

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

### HalfVector

The `HalfVector` type uses half-precision (16-bit) floating-point numbers, providing memory savings with acceptable precision loss for several applications.

```yaml
class: Document
table: document
fields:
  content: String
  ### Half-precision embedding for memory efficiency
  embedding: HalfVector(1536)
```

### SparseVector

The `SparseVector` type efficiently stores sparse vectors where most values are zero, which is ideal for high-dimensional data with few non-zero elements.

```yaml
class: Document
table: document
fields:
  content: String
  ### Sparse vector for keyword-based embeddings
  keywords: SparseVector(10000)
```

### Bit

The `Bit` type stores binary vectors where each element is 0 or 1, offering maximum memory efficiency for binary embeddings.

```yaml
class: Document
table: document
fields:
  content: String
  ### Binary vector for semantic hashing
  hash: Bit(256)
```

## Geography fields

Geography types are used for storing geospatial data on the surface of the Earth. They are stored as PostGIS geography columns in PostgreSQL using the WGS 84 coordinate system (SRID 4326), which is the standard used by GPS. The SRID is fixed to `4326`, available in Dart as `Geography.defaultSrid`; configuring a different SRID per column is not yet supported.

Like other fields, geography fields can be made optional by appending `?` to the type, for example `location: GeographyPoint?`.

All geography types support spatial filter operations such as proximity search, intersection, containment, and distance-based ordering. See the [Geography operators](../database/filtering#geography-operators) section for details.

To ensure optimal performance with spatial queries, consider creating a spatial index on your geography fields. See the [Geography indexes](../database/indexing#geography-indexes) section for more details.

:::info
The usage of Geography fields requires the PostGIS PostgreSQL extension to be installed. To set up PostGIS in a new or existing project, see the [Upgrading to PostGIS support](../../../upgrading/upgrade-to-postgis) guide.
:::

:::warning
Spatial operations are only supported on PostgreSQL. On SQLite, geography values are stored as text in EWKT format and round-trip through CRUD operations, but spatial query operations are not supported and throw at query time.
:::

### GeographyPoint

The `GeographyPoint` type stores a single geographic location defined by longitude and latitude.

```yaml
class: Store
table: store
fields:
  name: String
  location: GeographyPoint
  address: String?
```

### GeographyLineString

The `GeographyLineString` type stores an ordered sequence of points forming a path or route.

```yaml
class: DeliveryRoute
table: delivery_route
fields:
  name: String
  path: GeographyLineString
  description: String?
```

### GeographyPolygon

The `GeographyPolygon` type stores a closed region defined by an exterior ring and optional interior holes.

```yaml
class: DeliveryZone
table: delivery_zone
fields:
  name: String
  boundary: GeographyPolygon
  description: String?
```

### GeographyGeometryCollection

The `GeographyGeometryCollection` type stores a collection of mixed geography types (points, lines, and polygons) as a single field.

```yaml
class: Region
table: region
fields:
  name: String
  features: GeographyGeometryCollection
```
