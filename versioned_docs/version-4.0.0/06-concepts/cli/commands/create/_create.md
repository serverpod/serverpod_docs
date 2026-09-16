# serverpod create

`serverpod create` scaffolds a new Serverpod project. By default it generates a full server project with a database, a server package, a client package, and a Flutter app.

In an interactive terminal, `serverpod create` opens a setup screen where you choose the project's features. Pass `--template server` for a server without a Flutter app, or `--template module` to create a shareable module. To set up the prerequisites first, see [Installation](../../../../04-get-started/01-installation.md).

The `--database`, `--redis`, `--auth`, `--webapp`, `--website`, and `--ide` flags apply only when the setup screen does not open, for example with `--no-interactive` or in CI. Without the setup screen, the project also gets Redis configuration and editor setup for Claude, Cursor, and VS Code, unless you pass `--no-redis` or choose editors with `--ide`.

To create a project without a database, deselect **Database (recommended)** under **Database & caching** on the setup screen, or pass `--no-interactive --no-database`. The new project still has the generator's database feature on, so set `database: false` under [`features`](../../../01-server-fundamentals/03-configuration.md#features) in `config/generator.yaml`, then run `serverpod generate`.
