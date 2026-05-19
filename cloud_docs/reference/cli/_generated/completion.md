## Usage

```console
Command line completion commands

Usage: scloud completion <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  generate   Generate a command line completion specification
  install    Install a command line completion script

Run "scloud help" to see global options.
```

### Sub commands

#### `generate`

```console
Generate a command line completion specification

Usage: scloud completion generate [arguments]
-h, --help                Print this usage information.
-t, --tool (mandatory)    The completion tool to target

          [completely]    Use the `completely` tool (https://github.com/bashly-framework/completely)
          [carapace]      Use the `carapace` tool (https://carapace.sh/)

-e, --exec-name           Override the name of the executable
-f, --file                Write the specification to a file instead of stdout

Run "scloud help" to see global options.
```

#### `install`

```console
Install a command line completion script

Usage: scloud completion install [arguments]
-h, --help                Print this usage information.
-t, --tool (mandatory)    The completion tool to target

          [completely]    Use the `completely` tool (https://github.com/bashly-framework/completely)
          [carapace]      Use the `carapace` tool (https://carapace.sh/)

-e, --exec-name           Override the name of the executable
-d, --write-dir           Override the directory to write the script to

Run "scloud help" to see global options.
```
