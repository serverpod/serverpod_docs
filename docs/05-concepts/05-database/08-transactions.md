# Transactions

The essential point of a database transaction is that it bundles multiple steps into a single, all-or-nothing operation. The intermediate states between the steps are not visible to other concurrent transactions, and if some failure occurs that prevents the transaction from completing, then none of the steps affect the database at all.

Serverpod handles database transactions through the `session.dbNext.transaction` method. The transaction takes a method that performs any database queries or other operations and optionally returns a value.

Simply pass the transaction object to each database operation method to include them in the same atomic operation:

```dart
var result = await session.dbNext.transaction((transaction) async {
  // Do some database queries here.
  await Company.db.insertRow(session, company, transaction: transaction);
  await Employee.db.insertRow(session, employee, transaction: transaction);

  // Optionally return a value.
  return true;
});
```
