## Usage

```console
Creates a new Serverpod project, specify project name (must be lowercase with no special characters).

Usage: serverpod create [arguments]
-h, --help                         Print this usage information.
-f, --force                        Create the project even if there are issues that prevent it from running out of the box.
    --[no-]database                Include a database in the project.
    --[no-]redis                   Include Redis caching in the project.
    --[no-]auth                    Include authentication in the project. Requires a database.
    --[no-]webapp                  Configure the server to host a Flutter web app.
    --[no-]website                 Configure the server to host a website.
    --ide                          Configure agent skills and MCP servers for one or more IDEs. Use "none" to disable all IDE configuration.

          [none]                   Do not configure agent skills or MCP servers
          [antigravity]            Configure agent skills and MCP for Antigravity
          [codex]                  Configure agent skills and MCP for Codex
          [claude] (default)       Configure agent skills and MCP for Claude
          [cursor] (default)       Configure agent skills and MCP for Cursor
          [opencode]               Configure agent skills and MCP for OpenCode
          [vscode] (default)       Configure agent skills and MCP for VS Code

-n, --name (mandatory)             The name of the project to create.
                                   Can also be specified as the first argument.

Project Template
    --mini                         Shortcut for --template mini.
-t, --template                     Template to use when creating a new project

          [mini]                   Mini project with minimal features and no database
          [fullstack] (default)    Fullstack project including a server and a companion Flutter app
          [server]                 Server project with standard features including database
          [module]                 Serverpod Module project

Run "serverpod help" to see global options.
```

