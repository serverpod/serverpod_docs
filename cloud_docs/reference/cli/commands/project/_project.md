# scloud project

`scloud project` creates and manages projects on Serverpod Cloud. For an interactive walkthrough that also deploys for the first time, use `scloud launch`.

To create a project from the command line:

```bash
scloud project create my-project --enable-db
```

If the project doesn't need a database, pass `--no-enable-db` instead. Once created, deploy with [`scloud deploy`](/cloud/reference/cli/commands/deploy).

## Link an existing project

`scloud project link <project-id>` connects a local Serverpod codebase to an existing Cloud project. Use it when you've created the project in the Cloud console or when joining a teammate's project.

The link command writes or updates three files in your local project directory:

1. **`scloud.yaml`**: contains the project ID that ties your codebase to the Cloud project. Created in your server package directory (or the one specified with `--project-dir`).
2. **`.scloudignore`**: created from a template if it doesn't exist; defines which files should be excluded when uploading to Cloud (syntax mirrors `.gitignore`).
3. **`.gitignore`**: if your project is a workspace, the `.scloud/` directory is added to keep deployment artifacts out of version control.
