# serverpod create-repair-migration

The `serverpod create-repair-migration` command builds a migration by comparing the target state to what is actually in the live database, rather than to the latest migration. Use it to bring a database back in sync when it has drifted from your migration history.

Select which database to inspect with `--mode` (`development`, `staging`, or `production`), and target a specific version with `--version`. See [Migrations](../../data-and-the-database/database/migrations).
