# serverpod create-migration

`serverpod create-migration` compares your current models and database definition to the last migration and writes a new migration for the difference. Run it after changing your model files.

Use `--force` to proceed when a change may drop data, `--tag` to label the revision, or `--empty` to create a migration even when nothing has changed. For the full workflow, see [Migrations](/concepts/database/migrations).
