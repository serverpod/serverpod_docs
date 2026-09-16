# serverpod mcp-server

`serverpod mcp-server` starts a Model Context Protocol bridge to the `serverpod start` runner of a server project. An agent can use it to create and apply migrations, reload the server and Flutter app, and read logs.

The server directory is auto-detected from the current working directory. Pass `--server-dir` explicitly in monorepos that contain more than one server project.

The bridge drives a running session, so start one with `serverpod start` before asking an agent to use these tools. The bridge itself can stay connected while the session stops and starts.

## Set up your editor

`serverpod create` writes the MCP configuration for the editors you select, so a new project needs no manual setup. Run `serverpod create .` in an existing project to add the same files.

| Editor | File |
| --- | --- |
| Claude | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` |
| Antigravity | `.agents/plugins/serverpod-local/mcp_config.json` |
| Codex | `.codex/config.toml` |
| OpenCode | `opencode.json` |

In Cursor, once the file is created, open Cursor Settings and go to **Customize > MCPs**. There, make sure both the `serverpod` and `dart` servers are enabled.

### Set up any other MCP client

Serverpod registers two servers, its own bridge and the Dart MCP server. Any client that speaks MCP over stdio can run them, so write these two commands in whatever format your client expects.

```json
{
  "mcpServers": {
    "serverpod": {
      "command": "serverpod",
      "args": ["mcp-server", "--server-dir", "<project>_server"]
    },
    "dart": {
      "command": "dart",
      "args": ["mcp-server"]
    }
  }
}
```

The shape differs per editor. VS Code names the block `servers` rather than `mcpServers`. Antigravity and OpenCode name the Dart entry `dart-mcp-server`, and OpenCode puts both under an `mcp` block. Codex uses TOML.

:::note
Module projects get only the Dart MCP server. A module has no runnable server, so there is no `serverpod start` session for the bridge to connect to.
:::

## Migrations and your data

The bridge exposes three migration tools. `create_migration` and `create_repair_migration` write migration files without changing your database. Both accept a `force` parameter that proceeds past Serverpod's warning that a change may destroy data. `apply_migrations` then applies the pending migrations to your database.

:::warning
`apply_migrations` takes no parameters and applies every pending migration, including one an agent created with `force`. Keep `serverpod start` in its default `development` run mode, because another mode loads that environment's database. Review each `apply_migrations` call before you approve it.
:::
