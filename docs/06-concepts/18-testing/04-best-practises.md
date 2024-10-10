---
# Don't display do's and don'ts in the table of contents
toc_max_heading_level: 2
---

# Best practises

## Imports

While it's possible to import types and test helpers from the `serverpod_test`, it's completely redundant. The generated file exports everything that is needed. Adding an additional import is just unnecessary noise and will likely also be flagged as duplicated imports by the Dart linter.

### Don't

```dart
import 'serverpod_test_tools.dart';
// Don't import `serverpod_test` directly.
import 'package:serverpod_test/serverpod_test.dart'; ❌  
```

### Do

```dart
// Only import the generated test tools file.
// It re-exports all helpers and types that are needed.
import 'serverpod_test_tools.dart'; ✅ 
```

### Database clean up

Unless configured otherwise, by default `withServerpod` does all database operations inside a transaction that is rolled back after each `test` (see [the configuration options](the-basics#rollback-database-configuration) for more info on this behavior).

### Don't

```dart
withServerpod('Given ProductsEndpoint', (sessionBuilder, endpoints) {
  var session = sessionBuilder.build();

  setUp(() async {
    await Product.db.insertRow(session, Product(name: 'Apple', price: 10));
  });

  tearDown(() async {   
    await Product.db.deleteWhere( ❌ // Unnecessary clean up
      session,
      where: (_) => Constant.bool(true),
    );
  });

  // ...
});
```

### Do

```dart
withServerpod('Given ProductsEndpoint', (sessionBuilder, endpoints) {
  var session = sessionBuilder.build();

  setUp(() async {
    await Product.db.insertRow(session, Product(name: 'Apple', price: 10));
  });

  ✅  // Clean up can be omitted since the transaction is rolled back after each by default

  // ...
}); 
```

## Calling endpoints

While it's technically possible to instantiate an endpoint class and call its methods directly with a Serverpod `Session`, it's advised that you do not. The reason is that lifecycle events and validation that should happen before or after an endpoint method is called is taken care of by the framework. Calling endpoint methods directly would circumvent that and the code would not behave like production code. Using the test tools guarantees that the way endpoints behave during tests is the same as in production.

### Don't

```dart
void main() {
  // ❌ Don't instantiate endpoints directly
  var exampleEndpoint = ExampleEndpoint();

  withServerpod('Given Example endpoint', (
    sessionBuilder,
    _ /* not using the provided endpoints */,
  ) {
    var session = sessionBuilder.build();

    test('when calling `hello` then should return greeting', () async {
      // ❌ Don't call and endpoint method directly on the endpoint class.
      final greeting = await exampleEndpoint.hello(session, 'Michael'); 
      expect(greeting, 'Hello, Michael!');
    });
  });
}
```

### Do

```dart
void main() {
  withServerpod('Given Example endpoint', (sessionBuilder, endpoints) {
    var session = sessionBuilder.build();

    test('when calling `hello` then should return greeting', () async {
      // ✅ Use the provided `endpoints` to call the endpoint that should be tested.
      final greeting =
          await endpoints.example.hello(session, 'Michael');
      expect(greeting, 'Hello, Michael!');
    });
  });
}
```

## Unit and integration tests

It is significantly easier to navigate a project if the different types of tests are clearly separated.

### Don't

❌ Mix different types of tests together.

### Do

✅ Have a clear structure for the different types of test. Serverpod recommends the following two folders in the `server`:

- `test`: Unit tests.
- `integration_test`: Tests for endpoints or business logic modules using the `withServerpod` helper.
