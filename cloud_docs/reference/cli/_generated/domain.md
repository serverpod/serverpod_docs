## Usage

```console
Bring your own domain to Serverpod Cloud.

Get started by attaching a custom domain to your project with the command:

  $ scloud domain attach example.com <target> --project <project-id>

The valid targets are:
- api: Serverpod endpoints
- insights: Serverpod insights
- web: Relic server (e.g. REST API or a Flutter web app)


Usage: scloud domain <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  attach   Attach a custom domain to your project.
  detach   Detach a custom domain.
  list     List all custom domains.
  verify   Verify the DNS record for a custom domain.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/domain

```

### Sub commands

#### `attach`

```console
Attach a custom domain to your project.

You need to have a domain name and a DNS provider that supports
TXT, CNAME and/or ANAME records.

You can attach domains for each Serverpod server target.

The valid targets are:
- api: Serverpod endpoints
- insights: Serverpod insights
- web: Relic server (e.g. REST API or a Flutter web app)


Usage: scloud domain attach [arguments]
-h, --help                                     Print this usage information.
-p, --project (mandatory)                      The ID of the project.
                                               Can be omitted for existing projects that are linked.
                                               See `scloud project link --help`.
    --name (mandatory)                         The custom domain name. Can be passed as the first
                                               argument.
-t, --target=<api|insights|web> (mandatory)    The Serverpod server target of the custom domain,
                                               only one can be specified.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/domain

```

#### `list`

```console
List all custom domains.

Usage: scloud domain list [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/domain

```

#### `detach`

```console
Detach a custom domain.

Usage: scloud domain detach [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The custom domain name. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/domain

```

#### `verify`

```console
Verify the DNS record for a custom domain.

Usage: scloud domain verify [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The custom domain name. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/domain

```
