## Usage

```console
Manage the development stack for this project.

Usage: serverpod runner <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  attach   Attach to the development stack already running for this project.
  start    Start the development stack for this project and return, leaving it running in the background.
  status   Print the development stack's state and addresses for this project.
  stop     Stop the development stack running for this project.

Run "serverpod help" to see global options.
```

### Sub commands

#### `start`

```console
Start the development stack for this project and return, leaving it running in the background.

Usage: serverpod runner start [-- <server-args>]
-h, --help            Print this usage information.
-w, --[no-]watch      Watch files and use the Frontend Server.
                      (defaults to on)
-d, --directory       The server directory.
                      (defaults to "")
-t, --target          The server entrypoint, relative to the server directory.
                      (defaults to "bin/main.dart")
    --[no-]docker     Start Docker Compose services if a compose file exists.
    --[no-]flutter    Auto-launch companion Flutter apps on the first UI attach.
                      (defaults to on)

Run "serverpod help" to see global options.
```

#### `attach`

```console
Attach to the development stack already running for this project.

Usage: serverpod runner attach
-h, --help         Print this usage information.
-d, --directory    The server directory (defaults to auto-detect from current directory).
    --[no-]tui     Show the interactive terminal UI.
                   (defaults to on)

Run "serverpod help" to see global options.
```

#### `status`

```console
Print the development stack's state and addresses for this project.

Usage: serverpod runner status
-h, --help         Print this usage information.
-d, --directory    The server directory (defaults to auto-detect from current directory).

Run "serverpod help" to see global options.
```

#### `stop`

```console
Stop the development stack running for this project.

Usage: serverpod runner stop
-h, --help         Print this usage information.
-d, --directory    The server directory (defaults to auto-detect from current directory).

Run "serverpod help" to see global options.
```
