# Handling private dependencies

Serverpod Cloud supports Dart workspaces for managing private dependencies in your deployments. This lets you include local packages and organize monorepo structures.

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

## Current limitations

Serverpod Cloud currently does not support:

- **Private git references**: Dependencies pointing to private Git repositories using `git:` URLs are not supported during deployment.
- **Private package managers**: Custom package registry configurations are not supported.

If you need to include private code in your deployment, use Dart workspaces to manage these dependencies as local packages within your project structure.

## Workspace detection

The deployment process automatically detects if your project uses workspace resolution. When deploying from within a workspace, all workspace packages required by your Serverpod application are automatically included in the deployment package.

