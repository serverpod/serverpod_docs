## Usage

```console
Manage file storage for a project.

A storage holds the files your project uploads at runtime, such as user avatars or generated
documents.
Every project starts with a private storage "private" and a public storage "public".


Usage: scloud storage <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  create   Create a storage.
  list     List the storages of a project.

Danger Zone
  delete   Delete a storage and every file in it. This cannot be undone.

Mission Control
  file     Manage the files in a storage.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/storage

```

### Sub commands

#### `list`

```console
List the storages of a project.

Usage: scloud storage list [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked (see the "project
                             link" command) or if a global project context is set (see the "settings
                             set projectContext" command).

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/storage

```

#### `create`

```console
Create a storage.

The access of a storage decides who can read its files, and is fixed at creation.
A private storage is only readable by your project, a public storage is readable by anyone with the
URL.


Usage: scloud storage create [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command) or if a global project context is set (see
                                 the "settings set projectContext" command).
-s, --storage (mandatory)        The id of the new storage. Lowercase letters, digits and dashes.
                                 Can be passed as the first argument.
-a, --access=<public|private>    Who can read the files. "private": only your project. "public":
                                 anyone with the URL. Cannot be changed later.
                                 (defaults to "private")

Run "scloud help" to see global options.


Examples

  Create a private storage called user-uploads.

    $ scloud storage create user-uploads

  Create a storage whose files anyone with the URL can read.

    $ scloud storage create assets --access public

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/storage

```

#### `delete`

```console
Delete a storage and every file in it. This cannot be undone.

Usage: scloud storage delete [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked (see the "project
                             link" command) or if a global project context is set (see the "settings
                             set projectContext" command).
-s, --storage (mandatory)    The id of the storage. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/storage

```

#### `file`

```console
Manage the files in a storage.

Usage: scloud storage file <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  download   Download a file from a storage.
  list       List the files in a storage.
  upload     Upload a local file or directory to a storage.

Danger Zone
  delete     Delete a file or a folder from a storage.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/storage

```
