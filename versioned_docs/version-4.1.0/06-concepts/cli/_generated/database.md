## Usage

```console
Manage the embedded PostgreSQL database used by a Serverpod project.

Usage: serverpod database <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  start   Start the configured embedded PostgreSQL database and print how to connect to it.

Run "serverpod help" to see global options.
```

### Sub commands

#### `start`

```console
Start the configured embedded PostgreSQL database and print how to connect to it.

Usage: serverpod database start [arguments]
-h, --help                 Print this usage information.
-s, --server-dir=<path>    Server project directory. Defaults to auto-detection.
-m, --mode                 Serverpod run mode whose database config should be used.
                           (defaults to "development")
-p, --port=<integer>       TCP port override. Defaults to the configured database port. Requires a database password for the run mode.

Run "serverpod help" to see global options.
```
