# Caveats

## Transactions

As explained in [the basics](the-basics#seeding-the-database), the test tools are by default wrapping each test case in a transaction. That ensures  database calls and even further transactions are contained within that top level transaction. Since nested transactions are not natively supported by PostgreSQL, the test tools emulates this behaviour by using save points.

The following two cases are deviating from true transaction behavior:

### Concurrent transactions

Concurrent transactions are not supported with the default rollback database setting, see [this section](the-basics#rollback-database-configuration) for more information on how to test these scenarios.

### Database exceptions that are quelled

There is a specific case where the test tools behavior deviates from production behvaior. See example below:

```dart
var transactionFuture = session.db.transaction((tx) async {
    var data = UniqueData(number: 1, email: 'test@test.com');
    try {
        await UniqueData.db.insertRow(session, data, transaction: tx);
        await UniqueData.db.insertRow(session, data, transaction: tx);
    } on DatabaseException catch (_) {
        // Ignore the database exception
    }
});

// ATTENTION: This will throw an exception in production
// but not in the test tools.
await transactionFuture;
```

In production, the transaction call will throw if any database exception happened during its execution, _even_ if the exception was first caught inside the transaction. However, in the test tools this will not throw an exception due to how the nested transactions are emulated.

Please note that this case should be very rare as the above code doesn't really make sense.
