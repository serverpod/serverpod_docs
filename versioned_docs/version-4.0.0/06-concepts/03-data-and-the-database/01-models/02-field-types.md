---
description: Maps every Serverpod YAML field type to Dart, Postgres, SQLite, and JSON, including defaults, query operators, and storage caveats.
---

# Field types

Every model field has a YAML type that becomes a Dart type, a JSON encoding, and, on a [table](../database/tables) model, a database column. This catalog lists the mapping, allowed defaults, query operators, and storage caveats for each type. For the model file format, see [Working with models](../models).

## Overview

| YAML | Dart | Postgres | SQLite | JSON | Defaults |
| --- | --- | --- | --- | --- | --- |
| `bool` | `bool` | `boolean` | `INTEGER` (`0` / `1`) | `true` / `false` | `true`, `false` |
| `int` | `int` | `bigint` | `INTEGER` | number | any int; `serial` only with `defaultPersist` |
| `double` | `double` | `double precision` | `REAL` | number | any double |
| `String` | `String` | `text` | `TEXT` | string | quoted `'...'` or `"..."` |
| `DateTime` | `DateTime` | `timestamp without time zone` | `INTEGER` (UTC epoch ms) | UTC ISO-8601 string | `now`, or `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'` |
| `Duration` | `Duration` | `bigint` (milliseconds) | `INTEGER` (ms) | int milliseconds | `Xd Xh Xmin Xs Xms` |
| `ByteData` | `ByteData` | `bytea` | `BLOB` | `decode('<base64>', 'base64')` | none |
| `UuidValue` | `UuidValue` | `uuid` | `BLOB` (16 bytes, no dashes) | UUID string | `random`, `random_v7`, or a quoted UUID |
| `Uri` | `Uri` | `text` | `TEXT` | `Uri.toString()` | quoted URI string |
| `BigInt` | `BigInt` | `text` | `TEXT` | decimal string | any `BigInt.parse`-able value |

Vector types require a dimension of at least 1, for example `Vector(1536)`.

| YAML | Dart | Postgres | SQLite | JSON | Defaults |
| --- | --- | --- | --- | --- | --- |
| `Vector(n)` | `Vector` | `vector(n)` | `TEXT` | `List<double>` | none |
| `HalfVector(n)` | `HalfVector` | `halfvec(n)` | `TEXT` | `List<double>` | none |
| `SparseVector(n)` | `SparseVector` | `sparsevec(n)` | `TEXT` | string `{i:v,...}/n` | none |
| `Bit(n)` | `Bit` | `bit(n)` | `TEXT` | bit string | none |

Geography types use SRID 4326 (WGS 84), which is not configurable per column.

| YAML | Dart | Postgres | SQLite | JSON | Defaults |
| --- | --- | --- | --- | --- | --- |
| `GeographyPoint` | `GeographyPoint` | `geography(Point,4326)` | `TEXT` (EWKT) | EWKT, for example `SRID=4326;POINT(lon lat)` | none |
| `GeographyLineString` | `GeographyLineString` | `geography(LineString,4326)` | `TEXT` | EWKT | none |
| `GeographyPolygon` | `GeographyPolygon` | `geography(Polygon,4326)` | `TEXT` | EWKT | none |
| `GeographyGeometryCollection` | `GeographyGeometryCollection` | `geography(GeometryCollection,4326)` | `TEXT` | EWKT | none |

Enums store as `text` or `bigint`, not json. A field default is any of the enum's values.

| `serialized` | JSON | Postgres | SQLite |
| --- | --- | --- | --- |
| `byName` (default) | string literal | `text` | `TEXT` |
| `byIndex` | int index | `bigint` | `INTEGER` |

Collections, records, nested models, custom classes, and `dynamic` persist as `json` or `jsonb`. See [JSON vs JSONB](#json-vs-jsonb).

| YAML | JSON | Postgres default | SQLite (`json`) | SQLite (`jsonb`) |
| --- | --- | --- | --- | --- |
| `List<T>` | JSON array | `json` | `TEXT` | `BLOB` via `jsonb()` |
| `Set<T>` | JSON array (order not guaranteed) | `json` | `TEXT` | `BLOB` via `jsonb()` |
| `Map<String, V>` | JSON object | `json` | `TEXT` | `BLOB` via `jsonb()` |
| `Map<K, V>` (`K` is not `String`) | JSON array of `{k, v}` objects | `json` | `TEXT` | `BLOB` via `jsonb()` |
| `(int, String)` / `({int n})` | `{ "p": [...], "n": {...} }` | `json` | `TEXT` | `BLOB` via `jsonb()` |
| nested model / custom class | object JSON | `json` | `TEXT` | `BLOB` via `jsonb()` |
| `dynamic` | value plus type metadata | `json` | `TEXT` | `BLOB` via `jsonb()` |

## Nullability

A trailing `?` on the type makes the field nullable. Non-nullable fields are required constructor parameters. The `required` keyword is valid only on nullable fields: it makes the constructor parameter required while keeping the type nullable.

```yaml
class: Person
fields:
  name: String
  nickname: String?, required
  age: int?
```

The `dynamic` type is already nullable. `dynamic?` and `List<dynamic?>` are rejected. See [Required fields](../models#required-fields) and [Dynamic fields](./dynamic-fields#nullability).

## Serialization

Three encodings are involved when a value moves between the app, the server, and the database:

1. **Protocol JSON** (client and server): `toJson()` / `fromJson()`.
   - `int`, `bool`, `double`, and `String` pass through as native JSON.
   - Every other type converts, as listed in the overview tables.
2. **Postgres literals** used when writing SQL: UUIDs are quoted, `ByteData` is `\x` hex, vectors are `'[1,2,3]'`, geography is EWKT, and collections are JSON text.
3. **SQLite literals** used by the [client-side database](../database/client-side-database): `bool` is `0` / `1`, `DateTime` is epoch milliseconds, `UuidValue` is a 16-byte blob, `ByteData` is `X'hex'`, and `jsonb` values use `jsonb(...)`.

Protocol JSON for `DateTime` always uses `toUtc().toIso8601String()`. Postgres stores the value as `timestamp without time zone`, so stored values are UTC.

## Primitive types

```yaml
class: Sample
fields:
  active: bool
  count: int
  price: double
  name: String
  createdAt: DateTime
  timeout: Duration
  payload: ByteData
  uuid: UuidValue
  homepage: Uri
  huge: BigInt
```

### bool

```yaml
fields:
  published: bool, default=false
```

SQLite stores `false` as `0` and `true` as `1`, and reads those integers back as bools. Ordering operators (`>`, `<`, `>=`, `<=`) are not available. Equality operators are: `equals`, `notEquals`, `inSet`, `notInSet`.

### int

```yaml
fields:
  views: int, default=0
  invoiceNumber: int?, defaultPersist=serial
```

An `int` column is always 64-bit Postgres `bigint`, not `integer`. Serial IDs use `bigserial`. The `serial` default is valid only with `defaultPersist`, never with `default` or `defaultModel`. On SQLite, `serial` is supported only on the `id` column.

The `Duration` type also uses Postgres `bigint`. The column type is the same; the meaning is not. A `Duration` value is milliseconds.

### double

```yaml
fields:
  rating: double, default=0.0
```

On SQLite, `NaN` is stored as `NULL`, and `Infinity` is stored as `1e999`.

### String

```yaml
fields:
  title: String, default='Untitled'
```

Strings are unbounded `text` (Postgres) or `TEXT` (SQLite). There is no `varchar` length. String columns support `like`, `notLike`, `ilike`, and `notIlike` in addition to ordering and equality. On SQLite, `like` and `ilike` are both case-insensitive for ASCII characters. See [Filter](../database/filtering#like).

### DateTime

```yaml
fields:
  createdAt: DateTime, default=now
  publishedAt: DateTime?, default=2024-05-01T22:00:00.000Z
```

Values are always converted to UTC. The Postgres default for `now` is `CURRENT_TIMESTAMP`. SQLite stores UTC epoch milliseconds as `INTEGER`.

On an [immutable class](../models#immutable-classes), `now` is not valid with `default` or `defaultModel`. A table model can set `defaultPersist=now` instead.

### Duration

```yaml
fields:
  timeout: Duration, default=1d 2h 10min 30s 100ms
```

Stored as milliseconds in a `bigint` (Postgres) or `INTEGER` (SQLite) column, the same SQL type as `int`. JSON is that millisecond count as an integer.

### ByteData

```yaml
fields:
  blob: ByteData
```

No YAML default. Postgres inserts use `\x` hex for `bytea`. SQLite uses a `BLOB` with `X'hex'` literals. On the wire, the protocol JSON is a Postgres-style string: `decode('<base64>', 'base64')`.

### UuidValue

```yaml
fields:
  publicId: UuidValue, default=random
  orderedId: UuidValue, default=random_v7
  fixedId: UuidValue, default='550e8400-e29b-41d4-a716-446655440000'
```

The `random` default generates a UUID v4 (`Uuid().v4obj()` in Dart, `gen_random_uuid()` in Postgres). The `random_v7` default generates a UUID v7 (`Uuid().v7obj()` in Dart, `gen_random_uuid_v7()` in Postgres). SQLite stores the 16-byte value as a `BLOB` with no dashes.

On an [immutable class](../models#immutable-classes), `random` and `random_v7` are not valid with `default` or `defaultModel`. A table model can set `defaultPersist` instead.

### Uri

```yaml
fields:
  homepage: Uri, default='https://serverpod.dev'
```

A URI default must be a quoted string. Stored as `text` / `TEXT`. Query operators are equality only (`equals`, `notEquals`), not ordered comparison.

### BigInt

```yaml
fields:
  huge: BigInt, default='1234567890'
```

Stored as `text` / `TEXT`, not a numeric column. The JSON value is a decimal string. Any value `BigInt.parse` accepts is a valid default. Query operators are equality only (`equals`, `notEquals`).

## Enums

```yaml
enum: Animal
serialized: byName
default: unknown
values:
  - unknown
  - dog
  - cat
```

The `serialized` keyword has two values. `byName` is the default and stores the string literal as Postgres `text` / SQLite `TEXT`. `byIndex` stores the index as Postgres `bigint` / SQLite `INTEGER`.

Changing the order of a `byIndex` enum changes the stored integers and can corrupt existing data. The default `byName` mode is stable when values are added or reordered.

A field default is any of the enum's values. The enum's own `default` is the fallback when an unknown value is deserialized, not a column default. See [Handling unknown enum values](../models#handling-unknown-enum-values).

Enhanced enum [properties](../models#enhanced-enums-with-properties) support `int`, `double`, `bool`, `String`, and their nullable forms. Those properties exist only on the generated Dart enum; they are not extra columns.

## Collections and records

Type arguments are required: `List<String>`, `Map<String, int>`, `Set<UuidValue>`. Untyped `List` or `Map` is rejected.

```yaml
class: Packed
fields:
  tags: List<String>
  uniqueTags: Set<String>
  counts: Map<String, int>
  labeled: Map<int, String>
  pair: (int, String)
  named: ({int count})
```

- `List<T>` is a JSON array.
- `Set<T>` is also a JSON array. Order is not guaranteed after a round trip.
- `Map<String, V>` is a JSON object.
- `Map<K, V>` where `K` is not `String` is a JSON array of `{k, v}` objects, not a JSON object, because JSON object keys must be strings.
- Records serialize positional fields under `"p"` and named fields under `"n"`. A record with only positional fields omits `"n"`; a record with only named fields omits `"p"`. A single-element record needs a trailing comma: `(int,)`.

```json
{
  "pair": { "p": [1, "hello"] },
  "named": { "n": { "count": 42 } },
  "labeled": [{ "k": 1, "v": "a" }, { "k": 2, "v": "b" }]
}
```

No YAML defaults for `List`, `Map`, `Set`, or records.

## Nested models

A nested model (or custom class) in a JSON column is a copy stored on that row. Updating it does not update other rows that hold a similar object. A [`relation`](../database/relations/) field stores a foreign key instead, so multiple rows can point at the same object.

```yaml
class: Company
table: company
fields:
  address: Address
  billingAddress: Address?, relation
```

The `address` field is stored as json on `company`. The `billingAddress` field is a foreign key to an `address` row. See [Tables](../database/tables#data-representation).

## JSON vs JSONB

Serializable types (`List`, `Map`, `Set`, records, nested models, custom classes, and `dynamic`) default to Postgres `json` (SQLite `TEXT`). Setting `serializationDataType=jsonb` on the field, the class, or `serialize_as_jsonb_by_default: true` in `config/generator.yaml` stores them as:

- Postgres: `jsonb`, which can use a [GIN index](../database/indexing#gin-indexes)
- SQLite: `BLOB` via SQLite's `jsonb()` function

The `serializationDataType` keyword is not valid on primitives (`String`, `int`, `bool`, and the other core types). A GIN index requires every indexed field to be jsonb. See [Storing serializable fields as JSONB](../database/tables#storing-serializable-fields-as-jsonb).

## Vector types

```yaml
class: Document
table: document
fields:
  embedding: Vector(1536)
```

Dimension is required: `Vector(1536)`, `HalfVector(1536)`, `SparseVector(10000)`, `Bit(256)`. The dimension must be at least 1.

SQLite has no native vector type. Values are stored as text, vector query operators are not supported, and HNSW / IVFFLAT indexes are omitted.

On Postgres, the default index type is `hnsw`. `Vector`, `HalfVector`, and `Bit` also allow `ivfflat`. `SparseVector` allows only `hnsw`. Distance functions are `l2`, `innerProduct`, `cosine`, and `l1`. `Bit` also has Hamming and Jaccard.

Vector fields require the pgvector extension. See [Vector and geography fields](../database/vector-and-geography-fields) for usage, Dart APIs, and setup.

## Geography types

```yaml
class: Store
table: store
fields:
  location: GeographyPoint
```

Coordinates in EWKT are longitude then latitude: `SRID=4326;POINT(lon lat)`. No YAML defaults.

Indexes are `gist` (default) or `spgist` only. Query operators are `intersects`, `distanceWithin`, `distance`, `contains`, and `within` (Postgres `ST_*` / `ST_GeogFromText`).

Geography fields require PostGIS. On SQLite they are opaque EWKT strings: CRUD round-trips, spatial operators throw. See [Vector and geography fields](../database/vector-and-geography-fields#geography-fields) and [Upgrading to PostGIS support](../../../upgrading/upgrade-to-postgis).

## Dynamic and custom classes

A `dynamic` field holds any serializable value when the type is not known at compile time. Serverpod includes type metadata in the JSON so the value round-trips. That wrapper is an implementation detail. See [Dynamic fields](./dynamic-fields).

A hand-written Dart class can be a field type after it is registered in `config/generator.yaml`. It persists as json / jsonb like a nested model. See [Custom serialization](./custom-serialization).

## ID types

If `id` is omitted on a table model, it is `int?` with `defaultPersist=serial`.

| Type | YAML | Persist default | Model default | Postgres | SQLite |
| --- | --- | --- | --- | --- | --- |
| `int` | `id: int?, defaultPersist=serial` | `serial` | not allowed | `bigserial PRIMARY KEY` | `INTEGER PRIMARY KEY` (ROWID) |
| `UuidValue` | `id: UuidValue?, defaultPersist=random` | `random`, `random_v7` | `random`, `random_v7` | `uuid` | `BLOB` |

An `int` id must be nullable. `serial` is `defaultPersist` only, never `defaultModel`. SQLite allows autoincrement only on the `id` column.

Choosing between `int` and `UuidValue`, and generating the id before insert with `defaultModel=random`, is covered in [Choosing an ID strategy](../database/tables#choosing-an-id-strategy).

## Defaults

Allowed values by type are in the [overview](#overview) and in each type section. The `default`, `defaultModel`, and `defaultPersist` keywords are explained in [Default values](../models#default-values).

These types cannot have a YAML default:

- `ByteData`
- Vector types (`Vector`, `HalfVector`, `SparseVector`, `Bit`)
- Geography types
- `List`, `Map`, `Set`
- Records
- Nested models and custom classes
- `dynamic`

On an immutable class, `now`, `random`, and `random_v7` are not valid with `default` or `defaultModel`. Those values belong on `defaultPersist` instead.

## Indexes

Fields marked `!persist` cannot be indexed.

| Fields | Default index | Allowed |
| --- | --- | --- |
| Scalars | `btree` | `btree`, `hash`, `gin`, `gist`, `spgist`, `brin` |
| jsonb serializable | `gin` | `gin` requires every indexed field to be jsonb |
| `Vector` / `HalfVector` / `Bit` | `hnsw` | `hnsw`, `ivfflat` |
| `SparseVector` | `hnsw` | `hnsw` only |
| Geography | `gist` | `gist`, `spgist` |

Index types other than `btree` are Postgres-only. On SQLite they are skipped when a migration is created. See [Indexing](../database/indexing).

## Query operators

Table columns expose the operators below in [filters](../database/filtering).

| Types | Operators |
| --- | --- |
| `int`, `double`, `String`, `DateTime`, `Duration`, `UuidValue`, enums | `equals`, `notEquals`, `>`, `<`, `>=`, `<=`, `inSet`, `notInSet` |
| `int`, `double`, `DateTime`, `Duration` | `between`, `notBetween` |
| `String` | `like`, `notLike`, `ilike`, `notIlike` |
| `bool` | `equals`, `notEquals`, `inSet`, `notInSet` |
| `Uri`, `BigInt` | `equals`, `notEquals` |
| `Vector`, `HalfVector`, `SparseVector` | `distanceL2`, `distanceInnerProduct`, `distanceCosine`, `distanceL1` |
| `Bit` | `distanceHamming`, `distanceJaccard` |
| Geography | `intersects`, `distanceWithin`, `distance`, `contains`, `within` |

Vector and geography operators run on Postgres. They are not supported on SQLite.

## Postgres vs SQLite

The [client-side database](../database/client-side-database) is SQLite. These mappings differ from Postgres:

| Concern | Postgres | SQLite |
| --- | --- | --- |
| `bool` | `boolean` | `INTEGER` `0` / `1` |
| `int` | `bigint` | `INTEGER` |
| `DateTime` | `timestamp without time zone` | UTC epoch milliseconds |
| `UuidValue` | `uuid` | 16-byte `BLOB` |
| `ByteData` | `bytea` (`\x` hex) | `BLOB` (`X'hex'`) |
| `json` collections | `json` | `TEXT` |
| `jsonb` collections | `jsonb` | `BLOB` via `jsonb()` |
| Vectors | pgvector types, HNSW / IVFFLAT | `TEXT`, no vector indexes or operators |
| Geography | PostGIS geography, spatial operators | EWKT `TEXT`, no spatial operators |
| `serial` | any `int` column with `defaultPersist=serial` | `id` column only |
| `like` / `ilike` | `like` is case-sensitive | both are case-insensitive for ASCII |
| Non-`btree` indexes | created as declared | omitted, with a warning |

The `Duration` and `int` types share a 64-bit integer column on both dialects. The `BigInt` type is text on both, not a numeric type.

## Related

- [Working with models](../models): model file format, required fields, and default keywords.
- [Tables](../database/tables): table models, ID types, and json vs jsonb.
- [Vector and geography fields](../database/vector-and-geography-fields): pgvector and PostGIS usage.
- [Dynamic fields](./dynamic-fields): values whose type varies at runtime.
- [Custom serialization](./custom-serialization): hand-written Dart classes as field types.
- [Indexing](../database/indexing): index types, GIN, HNSW, and geography indexes.
- [Filter](../database/filtering): how to write the operators above.
- [Client-side database](../database/client-side-database): SQLite on the device.
- [Model reference](../../lookups/model-reference): every keyword in a model file.
