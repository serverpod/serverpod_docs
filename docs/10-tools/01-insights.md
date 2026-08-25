# Serverpod Insights

Serverpod has a companion app. It is currently available for Mac and Windows, but Linux is coming soon. The app has support for viewing your server's logs and health metrics, but we are adding many more features in version 1.2. You must use a version of the app that matches the version of Serverpod you use in your project, or not all features may work correctly.

![Serverpod Insights](/img/serverpod-insights.webp)

## Downloads

| App version          | MacOS                                                                 | Windows                                                                 |
| :------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| Serverpod 3 (latest) | [Download](https://downloads.serverpod.dev/macos/Serverpod-3.0.0.zip) | [Download](https://downloads.serverpod.dev/windows/serverpod-3.0.0.zip) |
| Serverpod 2          | [Download](https://downloads.serverpod.dev/macos/Serverpod-2.9.1.zip) | [Download](https://downloads.serverpod.dev/windows/serverpod-2.9.1.zip) |
| Serverpod 1.2.0      | [Download](https://downloads.serverpod.dev/macos/Serverpod-1.2.0.zip) | [Download](https://downloads.serverpod.dev/windows/serverpod-1.2.0.zip) |
| Serverpod 1.1.0      | [Download](https://downloads.serverpod.dev/macos/Serverpod-1.1.0.zip) | [Download](https://downloads.serverpod.dev/windows/serverpod-1.1.0.zip) |
| Serverpod 1.0.0      | [Download](https://serverpod.dev/insights/Serverpod-1.0.0.zip)        | n/a                                                                     |

## Database access

Insights can browse tables and run SQL queries against your database, but that access is disabled by default. The endpoints that serve it (`fetchDatabaseBulkData`, `runQueries`, `getDatabaseRowCount`, and `executeSql`) return an `AccessDeniedException` unless you explicitly enable them in the server configuration:

```yaml
insightsServer:
  port: 8081
  publicHost: localhost
  publicPort: 8081
  publicScheme: http
  enableDatabaseAccess: true
```

The same setting is available as the `SERVERPOD_INSIGHTS_SERVER_ENABLE_DATABASE_ACCESS` environment variable. Since the flag gives anyone holding the service secret full read and write access to the database, keep it off in production unless you need it.
