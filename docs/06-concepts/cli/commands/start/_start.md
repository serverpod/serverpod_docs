# serverpod start

The `serverpod start` command runs your project in development mode. It generates the latest code, starts the server with hot reload, and launches your companion Flutter apps, all in a single interactive terminal.

```bash
serverpod start
```

Run it from anywhere inside your project folder. To run another server entrypoint, pass its path relative to the server package:

```bash
serverpod start -t bin/main_enterprise.dart
```
