# Run scripts

The `serverpod run` command allows you to define and execute custom scripts from your `pubspec.yaml`. This is useful for common tasks like starting the server, running tests, or building executables.

To define scripts, add them to your server's `pubspec.yaml` under the `serverpod/scripts` section:

```yaml
name: my_server
version: 1.0.0

serverpod:
  scripts:
    start: dart bin/main.dart --apply-migrations
    maintenance: dart bin/main.dart --apply-migrations --role maintenance
    test: dart test
    build: dart compile exe bin/main.dart
```

To run a script:

```bash
$ serverpod run start
```

To list all available scripts, use the `--list` flag or omit the script name:

```bash
$ serverpod run --list
```

Scripts run in a shell environment (`bash` on Linux/macOS, `cmd` on Windows), so you can use pipes, conditionals, and environment variables. The CLI forwards signals like `Ctrl+C` to the running script and propagates exit codes.

:::note
Scripts use `bash` on Linux/macOS and `cmd` on Windows. If you need cross-platform compatibility, use Dart commands (e.g., `dart run`, `dart test`) or write platform-specific scripts.
:::
