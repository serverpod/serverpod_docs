# serverpod mcp-server

`serverpod mcp-server` starts a Model Context Protocol bridge to the `serverpod start` runner of a server project, letting an AI assistant build, run, and inspect your server.

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

In Cursor, once the file is created, open Cursor Settings and go to **Customize > MCPs**. There, make sure both **Serverpod** and **Dart** are enabled.  
You can also enable them using the "Tools & MCPs" option in the Command bar.

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

VS Code names the block `servers` rather than `mcpServers`, Antigravity names the Dart entry `dart-mcp-server`, and Codex uses TOML. The two commands are the same in every case.

:::note
Module projects get only the Dart MCP server. A module has no runnable server, so there is no `serverpod start` session for the bridge to connect to.
:::

## Migrations and your data

The migration tools change your database. Both `create_migration` and `create_repair_migration` accept a `force` parameter, which proceeds even when Serverpod warns that data may be destroyed.

:::warning
An agent decides on its own when to pass `force`. Point the bridge at a development database, not production, and read migration tool calls before you approve them.
:::

Keep your MCP client's approval prompts on for these tools. Most clients ask before each tool call, which is the point at which a destructive migration can still be stopped.
