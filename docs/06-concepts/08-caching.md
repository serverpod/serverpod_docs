# Caching

Accessing the database can be expensive for complex queries or if you need to run many different queries for a specific task. Serverpod makes it easy to cache frequently requested objects in the memory of your server. Any object can be cached, including primitive types (int, String, DateTime, Duration, ByteData, UuidValue), lists, maps, and serializable models. Objects can be stored in the Redis cache if your Serverpod is hosted across multiple servers in a cluster.

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
    userData = UserData.db.findById(session, userId);
    await session.caches.local.put(cacheKey, userData!, lifetime: Duration(minutes: 5));
  }

  // Return the user data to the Flutter app
  return userData;
}
```

In total, there are three caches where you can store your objects. Two caches are local to the server handling the current session, and one is distributed across the server cluster through Redis. There are two variants for the local cache, one regular cache, and a priority cache. Place objects that are frequently accessed in the priority cache.

Depending on the type and number of objects that are cached in the global cache, you may want to specify custom caching rules in Redis. This is currently not handled automatically by Serverpod.

### Caching primitive objects

To cache primitive objects, simply call the `put` method with the object. For the `get`, specify the object type as the generic parameter, just like for `SerializableModel` objects:

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

  // Return the user data to the Flutter app
  return userData;
}
```

If the `CacheMissHandler` returns `null`, no object will be stored in the cache.
