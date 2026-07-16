---
description: Replace Session.db once per session with a custom database layer for tracing, policy enforcement, tenant scoping, metrics, or tests.
---

# Intercept database access

Use a database interceptor when every database operation in a session needs the same cross-cutting behavior. The interceptor receives the new `Session` and Serverpod's framework-provided `Database`, then returns the database instance exposed as `session.db`.

Configure it when you construct `Serverpod`:

```dart
var databaseSessionCount = 0;

var pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  databaseInterceptor: (session, inner) {
    databaseSessionCount++;
    session.log('Created a database layer for this session.');
    return inner;
  },
);
```

This example observes database session creation and keeps the framework database unchanged. Serverpod calls the interceptor once when it creates each session. Repeated reads of `session.db` return the same database instance for that session.

## Return a custom database layer

Return an application-defined `Database` implementation to intercept its operations:

```dart
var pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  databaseInterceptor: (session, inner) {
    return PolicyDatabase(
      session: session,
      inner: inner,
    );
  },
);
```

In this example, `PolicyDatabase` is your implementation of the `Database` interface exported by `package:serverpod/serverpod.dart`. `Database` does not expose a public constructor for subclassing, so implement its interface and generate the required overrides with your IDE. Keep the supplied `inner` database and delegate every operation that your layer does not change. The returned object becomes `Session.db`, so generated calls such as `User.db.find(session)` also pass through it.

Common uses include:

- Recording query traces, timings, and metrics.
- Applying tenant scope to every supported query.
- Enforcing read and write policies.
- Blocking unsafe operations or writes in protected environments.
- Recording or replacing database behavior in tests.

Forward transaction objects, runtime parameters, ordering, pagination, row locks, and return options without changing their meaning. A policy layer should also account for raw database methods and transactions so callers cannot bypass it through another `Database` method.

Do not retain the session or its inner database after the session closes.

:::warning

Custom database layers depend on the `Database` API from `serverpod_database`. This API may receive breaking changes in a minor Serverpod release. Review and test the complete implementation whenever you upgrade Serverpod.

:::

## Use an interceptor in integration tests

Generated `withServerpod` test helpers accept the same `databaseInterceptor` callback. This lets a test count session creation or return a recording database layer without changing server startup code:

```dart
var interceptedSessions = 0;

withServerpod(
  'database policy',
  databaseInterceptor: (session, inner) {
    interceptedSessions++;
    return inner;
  },
  (sessionBuilder, _) {
    test('creates the database layer for a test session', () {
      var beforeBuild = interceptedSessions;
      sessionBuilder.build();
      expect(interceptedSessions, beforeBuild + 1);
    });
  },
);
```

The callback is also invoked once for every test session created by the helper.
