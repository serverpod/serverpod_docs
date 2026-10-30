## Usage

```console
Delete the cached server build and generation staleness stamp.

The next `serverpod start` recompiles from scratch, and the next `serverpod generate` regenerates code.

Only needed when `serverpod start` keeps reporting compilation errors that have already been fixed, or `serverpod generate` leaves bad output.

Usage: serverpod clean [arguments]
-h, --help         Print this usage information.
-d, --directory    The server directory (defaults to auto-detect from current directory).

Run "serverpod help" to see global options.
```

