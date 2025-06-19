# Runtime parameters

Runtime parameters in Serverpod allow you to fine-tune the behavior of the database engine for specific queries or workloads. This can significantly improve performance, especially for complex queries or large datasets.

:::warning
Setting runtime parameters affects PostgreSQL's query planning and execution. Always test different parameter combinations with your specific dataset and query patterns to find the optimal configuration.
:::

## Parameter scopes

Runtime parameters can be applied with different scopes:

- **Global scope** (default): Parameters affect all subsequent queries in the session.
- **Local scope**: Parameters only affect the current transaction.

```dart
var hnswOptions = HnswIndexQueryOptions(efSearch: 40);

// Global scope - affects all queries in this session
await session.db.setRuntimeParameters([hnswOptions]);

// Local scope - only affects current transaction
await session.db.transaction((transaction) async {
  await session.db.setRuntimeParameters([hnswOptions], transaction: transaction);

  var results = await Document.db.find(
    session,
    where: (t) => t.embedding.distanceCosine(queryVector) < 0.5,
    limit: 10,
    orderBy: (t) => t.embedding.distanceCosine(queryVector),
    transaction: transaction,
  );

  return results;
});
```

## Combining multiple parameter groups

You can combine different runtime parameter groups for comprehensive optimization:

```dart
// Create multiple parameter groups
var hnswOptions = HnswIndexQueryOptions(efSearch: 64);
var vectorOptions = VectorIndexQueryOptions(enableIndexScan: true);

// Apply all parameter groups (globally or locally)
await session.db.setRuntimeParameters([vectorOptions, hnswOptions]);
```

## Vector runtime parameters

When working with vector similarity searches, you can fine-tune query performance by setting runtime parameters that control the behavior of vector indexes.

:::info
Runtime parameters are particularly useful when you need to balance between query speed and result quality. For real-time applications, you might prefer faster but less accurate results, while for analytical workloads, you might prioritize accuracy over speed.
:::

### General vector query optimization

Use `VectorIndexQueryOptions` to control general PostgreSQL settings that affect vector query performance:

```dart
// Configure general vector query parameters
var vectorOptions = VectorIndexQueryOptions(
  enableIndexScan: true,             // Enable/disable index scans
  enableSeqScan: false,              // Enable/disable sequential scans
  minParallelTableScanSize: 1024,    // Min number of 8KB chunks to scan before parallelizing scans
  parallelSetupCost: 1000,           // Estimated cost of launching parallel worker processes
  maintenanceWorkMem: 65536,         // Memory in KB for operations such as index creation
  maxParallelMaintenanceWorkers: 2,  // Increase to speed up index creation on large tables
  maxParallelWorkersPerGather: 2,    // Increase to speed up queries without an index
);

// Apply runtime parameters to the session
await session.db.setRuntimeParameters([vectorOptions]);

// Perform vector search with optimized PostgreSQL settings
var results = await Document.db.find(
  session,
  where: (t) => t.embedding.distanceCosine(queryVector) < 0.7,
  orderBy: (t) => t.embedding.distanceCosine(queryVector),
  limit: 50,
);
```

### HNSW index optimization

For queries using HNSW indexes, use `HnswIndexQueryOptions` to control search behavior:

```dart
import 'package:serverpod/serverpod.dart';

// Configure HNSW runtime parameters
var hnswOptions = HnswIndexQueryOptions(
  efSearch: 40,                          // Higher values = better recall, slower search
  iterativeScan: IterativeScan.relaxed,  // Relaxed scan for better recall
  maxScanTuples: 20000,                  // Limit number of tuples to scan
  scanMemMultiplier: 2,                  // Memory multiplier for scanning
);

// Apply runtime parameters to the session before performing the query
await session.db.setRuntimeParameters([hnswOptions]);
```

### IVFFLAT index optimization

For queries using IVFFLAT indexes, use `IvfFlatIndexQueryOptions` to control search behavior:

```dart
// Configure IVFFLAT runtime parameters
var ivfFlatOptions = IvfFlatIndexQueryOptions(
  probes: 10,                           // Number of probes to search (higher = better recall)
  iterativeScan: IterativeScan.strict,  // Strict scan for exact order by distance
  maxProbes: 20,                        // Maximum number of probes to use
);

// Apply runtime parameters to the session before performing the query
await session.db.setRuntimeParameters([ivfFlatOptions]);
```

### Iterative scan modes

The `IterativeScan` enum controls how vector indexes handle scanning:

- **`IterativeScan.strict`**: Ensures results are in exact order by distance (better precision).
- **`IterativeScan.relaxed`**: Allows slightly out-of-order results but provides better recall.

## Setting global runtime parameters on startup

To set global runtime parameters, add a call to `setRuntimeParameters` right at the start of the server, inside the `run` function of `lib/server.dart` module.

```dart
// Add this import to expose the `internalSession` getter on `pod` variable.
import 'package:serverpod/src/server/serverpod.dart';
// ...

void run(List<String> args) async {
  // Initialize Serverpod and connect it with your generated code.
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // ...
  // Set global runtime parameters for the session
  await pod.internalSession.db.setRuntimeParameters([
    VectorIndexQueryOptions(enableIndexScan: true),
    HnswIndexQueryOptions(efSearch: 64),
  ]);
}
```
