# Reactive Future Calls

Reactive future calls let you react to database changes in near real-time. When a row is inserted, updated, or deleted, Serverpod can automatically and asynchronously invoke your code with the changed data. This is useful for scenarios like sending notifications when an order is confirmed, syncing data to external systems, or triggering workflows based on state changes.

Under the hood, reactive future calls use PostgreSQL triggers and an outbox pattern. A database trigger fires within the same transaction as the data change, writing an entry to an outbox table. Serverpod periodically polls the outbox on a configurable scan interval and dispatches matching entries to your handler. Because the trigger runs in the same transaction, rolled-back changes never produce events.

## Creating a reactive future call

Every model with a database table gets a generated intermediate class that you extend. For example, if you have a `Trip` model, Serverpod generates `TripReactiveFutureCall`:

```dart
import 'package:serverpod/serverpod.dart';
import 'src/generated/protocol.dart';

class NotifyPassengersAboutTripConfirmation extends TripReactiveFutureCall {
  @override
  WhereExpressionBuilder<TripTable> get where =>
      (t) => t.status.equals('Confirmed');

  @override
  Future<void> react(Session session, List<Trip> objects) async {
    for (final trip in objects) {
      // Send notifications to passengers
    }
  }
}
```

The `where` getter defines a condition that becomes a `WHEN` clause on the PostgreSQL trigger. Only changes matching this condition will create outbox entries. In the example above, the trigger only fires when the `status` column equals `'Confirmed'`.

The `react` method is called with all matching rows from a single outbox scan. Rows are batched together for efficiency.

## Detecting column changes

Standard expressions filter on the new row's values, but sometimes you need to react when a specific column *changes*. The `hasChanged()` method generates a trigger condition that compares the old and new values of a column:

```dart
class OnSensorHeightChanged extends SensorReactiveFutureCall {
  @override
  WhereExpressionBuilder<SensorTable> get where =>
      (t) => t.sensorHeight.hasChanged();

  @override
  Future<void> react(Session session, List<Sensor> objects) async {
    // Handle sensor height changes
  }
}
```

This produces the PostgreSQL trigger condition `OLD."sensorHeight" IS DISTINCT FROM NEW."sensorHeight"`.

:::info
When `hasChanged()` is used in the condition, the trigger is restricted to `UPDATE` operations only. This is because `OLD` row values are not available for `INSERT` triggers, and `NEW` values are not available for `DELETE` triggers.
:::

You can compose `hasChanged()` with other expressions using `&` (AND) and `|` (OR):

```dart
class OnCriticalSensorChange extends SensorReactiveFutureCall {
  @override
  WhereExpressionBuilder<SensorTable> get where =>
      (t) => t.sensorHeight.hasChanged() &
             (t.sensorTemperature.hasChanged() |
              t.sensorTemperature > 100.0);

  @override
  Future<void> react(Session session, List<Sensor> objects) async {
    // React when height changes AND (temperature changes OR exceeds 100)
  }
}
```

## Code generation

After creating your reactive future call class, run code generation:

```bash
$ serverpod generate
```

Your reactive future calls are automatically discovered and registered alongside regular future calls. No manual registration is needed.

## How it works

When the server starts, the following happens automatically:

1. PostgreSQL triggers are created (or replaced) for each registered reactive future call.
2. Orphaned triggers from previously registered handlers are dropped.
3. An outbox scanner starts polling for new entries.

When data changes in a watched table:

1. The trigger evaluates the `WHEN` condition.
2. If matched, the trigger inserts a row into the outbox table within the same transaction.
3. The outbox scanner picks up new entries on its next poll.
4. Entries are grouped by handler and dispatched to the `react` method.
5. Processed entries are deleted from the outbox.

:::info
The outbox scanner uses the same scan interval as regular future calls, configured via the `futureCall.scanInterval` setting in your YAML configuration.
:::

## Transaction safety

Because the trigger runs inside the same database transaction as the data change, reactive future calls have transactional guarantees:

- If a transaction is rolled back, the outbox entry is also rolled back and `react` is never called.
- If a transaction is committed, the outbox entry is guaranteed to exist and will be processed.

```dart
// This will NOT trigger react — the transaction is rolled back
await session.db.transaction((transaction) async {
  await Trip.db.insertRow(session, Trip(status: 'Confirmed'));
  throw Exception('Something went wrong');
});

// This WILL trigger react — the transaction is committed
await session.db.transaction((transaction) async {
  await Trip.db.insertRow(session, Trip(status: 'Confirmed'));
});
```

## Migrations

When you add your first reactive future call, a new migration is needed to create the outbox table. Run:

```bash
$ serverpod create-migration
```

Reactive triggers are managed at runtime, not through migrations. They are created fresh each time the server starts, so schema changes from migrations won't cause stale trigger references.
