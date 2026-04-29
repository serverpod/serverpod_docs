---
title: Project identifier
---

# Project identifier

The identifier given to a project in Serverpod Cloud must adhere to these rules:

- Globally unique
- Between 6 and 32 characters long
- Contain only lowercase letters, numbers, and hyphens

When creating a new project (see also the
[`scloud launch`](/cloud/reference/cli/commands/launch/)
or
[`scloud project`](/cloud/reference/cli/commands/project/)
commands) you will get an error message if the name is not valid.

Most `scloud` commands need to know which project to operate on, which can be
specified in multiple ways:
- The `scloud.yaml` file in your server package's root directory (see also the [`scloud project link`](/cloud/reference/cli/commands/project/) command)
- The `-p` / `--project` command line option
- The `SERVERPOD_CLOUD_PROJECT_ID` environment variable

## Default server domain

Your project is automatically set up with default server domain names
which begin with the project id. 

For example if your project id is 'my-app', then your server can be accessed at:
- Web:      https://my-app.serverpod.space/
- API:      https://my-app.api.serverpod.space/
