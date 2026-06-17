---
sidebar_position: 1
---

# Handling private dependencies

Serverpod Cloud supports deploying your project with private dependencies.
The typical methods are:
- Dart workspaces, which let you include local packages within a monorepo structure
- Access credentials for dependencies in private git repositories

## Using Dart workspaces

To use Dart workspaces for private dependencies, set up a workspace root with a `pubspec.yaml` that includes a `workspace` field:

```yaml
name: my_project
publish_to: none

environment:
  sdk: ">=3.8.0 <4.0.0"

workspace:
  - packages/shared_utilities
  - my_project_flutter
  - my_project_client
  - my_project_server
```

Each package in the workspace should include `resolution: workspace` in its `pubspec.yaml`:

```yaml
name: shared_utilities
version: 1.0.0

resolution: workspace

environment:
  sdk: ">=3.8.0 <4.0.0"

dependencies:
  serverpod_serialization: ^2.9.0
```

When you deploy your Serverpod application, the CLI automatically detects workspace structures and includes all necessary workspace packages in your deployment package.

## Using private git dependencies

If your server depends on Dart packages from a private git repository, the
Serverpod Cloud build process needs to be given read access to it.

Do this by setting a _build secret_ on the project. SSH keys are supported, and you store the private SSH key in the build secret.

:::info
Build secrets are kept separate from runtime secrets and will not be accessible
anywhere outside the build pipeline. They are automatically encrypted in transit
and at rest.
:::

### CLI commands for build secrets

Use the `scloud deployment build-secret` commands to manage your build secrets.

#### List the current build secrets
```sh
$ scloud deployment build-secret list
```

#### Add or modify a build secret
```sh
$ scloud deployment build-secret set MY_SECRET_NAME "my-private-ssh-key"
```

#### Add or modify a build secret with the value in a file
```sh
$ scloud deployment build-secret set MY_SECRET_NAME --from-file my_private_ssh_key_file
```

#### Remove a build secret
```sh
$ scloud deployment build-secret unset MY_SECRET_NAME
```

### Accessing a private repository in GitHub

If you are using GitHub, you can set up a _deploy key_ for this.
It only needs read access.

[Set up deploy keys in GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#set-up-deploy-keys)

Then store the private SSH key as a build secret on your Serverpod Cloud project,
and redeploy.

## Current limitations

Serverpod Cloud currently does not support:

- **Private package managers**: Custom package registry configurations are not supported.
