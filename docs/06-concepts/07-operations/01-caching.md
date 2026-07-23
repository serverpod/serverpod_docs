---
description: Caching in Serverpod stores frequently requested objects in local server memory or a distributed Redis cache to reduce expensive database queries.
---

# Caching

Accessing the database can be expensive for complex queries or if you need to run many different queries for a specific task. Serverpod makes it easy to cache frequently requested objects in the memory of your server. Any object can be cached, including primitive types (`int`, `String`, `DateTime`, `Duration`, `ByteData`, `UuidValue`), lists, maps, and serializable models. Objects can be stored in the Redis cache if your Serverpod is hosted across multiple servers in a cluster.

:::info
Objects must be serializable to be cached. Non-serializable objects will throw an error when attempting to cache them. Most Dart types are serializable, including primitives, collections, and custom objects with `toJson`/`fromJson` methods. All objects that can be used with endpoints or the database are supported.
:::

## Caching objects

Caches can be accessed through the `Session` object. This is an example of an endpoint method for requesting data about a user:

```dart
Future<UserData> getUserData(Session session, int userId) async {
  // Define a unique key for the UserData object
  var cacheKey = 'UserData-$userId';

  // Try to retrieve the object from the cache
  var userData = await session.caches.local.get<UserData>(cacheKey);

  // If the object wasn't found in the cache, load it from the database and
  // save it in the cache. Make it valid for 5 minutes.
  if (userData == null) {
    userData = await UserData.db.findById(session, userId);
    await session.caches.local.put(cacheKey, userData!, lifetime: Duration(minutes: 5));
  }

  // Return the user data to the client
  return userData;
}
```

There are three caches where you can store your objects, all reached through the `Session` object. Two are local to the server handling the current session: a regular cache (`session.caches.local`) and a priority cache (`session.caches.localPrio`) for frequently accessed objects. The third, `session.caches.global`, is distributed across the server cluster through Redis.

Depending on the type and number of objects that are cached in the global cache, you may want to specify custom caching rules in Redis. This is currently not handled automatically by Serverpod.

:::info
During development, you can run code that uses the global cache without a running Redis server. If Redis is unreachable (or not configured) in a non-production run mode, the global cache falls back to an isolated in-memory cache.
:::

### Caching primitive objects

To cache primitive objects, call the `put` method with the object. For the `get`, specify the object type as the generic parameter, as for `SerializableModel` objects:

```dart
await session.caches.local.put('userCount', 17, lifetime: Duration(minutes: 5));

var count = await session.caches.local.get<int>('userCount');
```

For `DateTime` objects, it is recommended to always cache them as UTC. Otherwise, you may get unexpected results when retrieving the object from the cache.

```dart
var lastUpdate = DateTime.now().toUtc();

await session.caches.local.put('lastUpdate', lastUpdate);

// Retrieved `DateTime` object will always be in UTC.
var cached = await session.caches.local.get<DateTime>('lastUpdate');
```

### Caching lists and collections

Lists and collections can also be cached directly:

```dart
var users = [UserData(name: 'Alice'), UserData(name: 'Bob')];

await session.caches.local.put('users', users);

var cachedUsers = await session.caches.local.get<List<UserData>>('users');
```

### Cache miss handler

If you want to handle cache misses in a specific way, you can pass in a `CacheMissHandler` to the `get` method. The `CacheMissHandler` makes it possible to store an object in the cache when a cache miss occurs.

The above example rewritten using the `CacheMissHandler`:

```dart
Future<UserData> getUserData(Session session, int userId) async {
  // Define a unique key for the UserData object
  var cacheKey = 'UserData-$userId';

  // Try to retrieve the object from the cache
  var userData = await session.caches.local.get(
    cacheKey,
    // If the object wasn't found in the cache, load it from the database and
    // save it in the cache. Make it valid for 5 minutes.
    CacheMissHandler(
      () async => UserData.db.findById(session, userId),
      lifetime: Duration(minutes: 5),
    ),
  );

  // Return the user data to the client
  return userData;
}
```

If the `CacheMissHandler` returns `null`, no object will be stored in the cache.

## Sending custom Redis commands

Redis supports operations that the global cache does not expose, such as atomic counters and sorted sets. If you want to use these operations, you can borrow the connection Serverpod already manages and send the command using `getConnection`:

```dart
Future<int?> incrementCounter(Session session, String counterName) async {
  var command = await session.serverpod.redisController?.getConnection();
  if (command == null) return null;

  var result = await command.send_object(['INCR', 'my_app:$counterName']);
  return result is int ? result : null;
}
```

The connection is `null` when Redis is disabled or unreachable, including when the global cache is running on its in-memory development fallback. Responses come back in the shape Redis defines for the command, so check the result before casting it.

The returned `RedisCommand` is Serverpod's own connection. Do not close it or replace `Serverpod.redisController`. It is also a good practice to namespace your keys so they cannot collide with Serverpod's cache entries.
