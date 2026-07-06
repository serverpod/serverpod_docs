---
description: Store geospatial data in Serverpod models using GeographyPoint, GeographyLineString, GeographyPolygon, and GeographyGeometryCollection backed by PostGIS.
---

# Geography fields

Geography types are used for storing geospatial data on the surface of the Earth. They are stored as PostGIS geography columns in PostgreSQL using the WGS 84 coordinate system (SRID 4326), which is the standard used by GPS. The SRID is fixed to `4326`, available in Dart as `Geography.defaultSrid`; configuring a different SRID per column is not yet supported.

Like other fields, geography fields can be made optional by appending `?` to the type, for example `location: GeographyPoint?`.

All geography types support spatial filter operations such as proximity search, intersection, containment, and distance-based ordering. See the [Geography operators](../database/filter#geography-operators) section for details.

To ensure optimal performance with spatial queries, consider creating a spatial index on your geography fields. See the [Geography indexes](../database/indexing#geography-indexes) section for more details.

:::info
The usage of Geography fields requires the PostGIS PostgreSQL extension to be installed. To set up PostGIS in a new or existing project, see the [Upgrading to PostGIS support](../../upgrading/upgrade-to-postgis) guide.
:::

:::warning
Spatial operations are only supported on PostgreSQL. On SQLite, geography values are stored as text in EWKT format and round-trip through CRUD operations, but spatial query operations are not supported and throw at query time.
:::

## GeographyPoint

The `GeographyPoint` type stores a single geographic location defined by longitude and latitude.

```yaml
class: Store
table: store
fields:
  name: String
  location: GeographyPoint
  address: String?
```

## GeographyLineString

The `GeographyLineString` type stores an ordered sequence of points forming a path or route.

```yaml
class: DeliveryRoute
table: delivery_route
fields:
  name: String
  path: GeographyLineString
  description: String?
```

## GeographyPolygon

The `GeographyPolygon` type stores a closed region defined by an exterior ring and optional interior holes.

```yaml
class: DeliveryZone
table: delivery_zone
fields:
  name: String
  boundary: GeographyPolygon
  description: String?
```

## GeographyGeometryCollection

The `GeographyGeometryCollection` type stores a collection of mixed geography types (points, lines, and polygons) as a single field.

```yaml
class: Region
table: region
fields:
  name: String
  features: GeographyGeometryCollection
```
