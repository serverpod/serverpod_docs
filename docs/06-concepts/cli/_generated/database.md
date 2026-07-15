## Usage

```console
Manage the embedded PostgreSQL database used by a Serverpod project.

Usage: serverpod database <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  start   Start the configured embedded PostgreSQL database over TCP.

Run "serverpod help" to see global options.
```

### Sub commands

#### `start`

```console
Start the configured embedded PostgreSQL database over TCP.

Usage: serverpod database start [arguments]
-h, --help                 Print this usage information.
-s, --server-dir=<path>    Server project directory. Defaults to auto-detection.
-m, --mode                 Serverpod run mode whose database config should be used.
                           (defaults to "development")
-p, --port=<integer>       TCP port override. Defaults to the configured database port.

Run "serverpod help" to see global options.
```
