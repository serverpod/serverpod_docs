## Usage

```console
Repairs the database by comparing the target state to what is in the live database instead of comparing to the latest migration.

Usage: serverpod create-repair-migration [arguments]
-h, --help       Print this usage information.
-f, --force      Creates the migration even if there are warnings or information that may be destroyed.
-t, --tag        Add a tag to the revision to easier identify it.
-v, --version    The target version for the repair. If not specified, the latest migration version will be repaired.
-m, --mode       Used to specify which database configuration to use when fetching the live database definition.
                 [development (default), staging, production]

Run "serverpod help" to see global options.
```

