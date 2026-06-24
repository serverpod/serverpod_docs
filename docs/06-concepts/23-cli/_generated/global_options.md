## Usage

```console
Manage your serverpod app development

Usage: serverpod <command> [arguments]

Global options:
-h, --help                     Print this usage information.
-q, --quiet                    Suppress all cli output. Is overridden by  -v, --verbose.
-v, --verbose                  Prints additional information useful for development. Overrides --q, --quiet.
-a, --[no-]analytics           Toggles if analytics data is sent.
                               (defaults to on)
    --[no-]interactive         Enable interactive prompts. Automatically disabled in CI environments.
    --version                  Prints the active version of the Serverpod CLI.
    --experimental-features    Enable experimental features. Experimental features might be removed at any time.

Available commands:
  cloud                     Manage Serverpod Cloud projects through the Serverpod Cloud.
  completion                Command line completion commands
  create                    Creates a new Serverpod project, specify project name (must be lowercase with no special characters).
  create-migration          Creates a migration from the last migration to the current state of the database.
  create-repair-migration   Repairs the database by comparing the target state to what is in the live database instead of comparing to the latest migration.
  generate                  Generate code from yaml files for server and clients.
  language-server           Launches a serverpod language server communicating with JSON-RPC-2 intended to be used with a client integrated in an IDE.
  mcp-server                Start an MCP bridge to the `serverpod start` runner of one server project.
  quickstart                Creates a new Serverpod project with basic options.
  run                       Run a script defined in the "serverpod/scripts" section of pubspec.yaml.
  upgrade                   Upgrade Serverpod to the latest version.
  version                   Prints the active version of the Serverpod CLI.

Run "serverpod help <command>" for more information about a command.
```
