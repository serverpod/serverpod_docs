# `project`

`scloud project` provides commands for managing your Serverpod Cloud projects.

A project is created by running the following command:

```bash
scloud project create my-project --enable-db
```

If the project does not need a databse (e.g. if it is a [Serverpod Mini project](https://docs.serverpod.dev/get-started-with-mini)), the `--no-enable-db` flag can instead be passed.

See the [`deploy` command](./deploy) on how to deploy your project.

## Linking an existing project

If you have an existing Serverpod Cloud project and want to connect your local codebase to it, use the `link` command:

```bash
scloud project link my-project
```

### What the link command does

The `link` command creates or updates configuration files in your local project directory to connect it to an existing Serverpod Cloud project. Specifically, it:

1. **Creates or updates `scloud.yaml`**: This file contains the project ID that identifies which Serverpod Cloud project your local codebase is connected to. The file is created in your server package directory (or the directory specified with `--project-dir`).

2. **Creates `.scloudignore`**: If this file doesn't exist, the command creates it with a template that specifies which files should be ignored when uploading to Serverpod Cloud. This file works similarly to `.gitignore`.

3. **Updates `.gitignore`**: If your project is part of a workspace, the command automatically adds the `.scloud/` directory to your `.gitignore` file to prevent deployment artifacts from being committed to version control.

### When to use link

Use the `link` command when:
- You have an existing Serverpod Cloud project and want to connect a local codebase to it
- You're working with a project that was created through the web console or by another team member
