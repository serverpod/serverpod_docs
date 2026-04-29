# Deployment hooks

Deployment hooks allow you to run custom scripts at specific points during the deployment lifecycle. This enables you to automate tasks such as building Flutter apps, running database migrations, or performing custom setup steps before or after deployment.

## Overview

Serverpod Cloud supports two types of deployment hooks:

- **`pre_deploy`**: Scripts that run before your project is packaged and uploaded
- **`post_deploy`**: Scripts that run after your project has been successfully uploaded

These hooks are configured in your `scloud.yaml` file and are executed in your project directory.

## When hooks are executed

### Pre-deploy hook

The `pre_deploy` hook runs:

1. After dependency validation
2. Before the project is zipped
3. Before the project is uploaded to Serverpod Cloud

This is the ideal place for:

- Building Flutter applications
- Running code generation
- Compiling assets
- Running tests
- Any preparation steps that need to happen before packaging

### Post-deploy hook

The `post_deploy` hook runs:

1. After the project has been successfully uploaded
2. After the upload confirmation is received
3. Before the deployment process completes

This is the ideal place for:

- Sending deployment notifications
- Triggering external services
- Running post-deployment validation
- Any cleanup or follow-up tasks

:::warning

If a `pre_deploy` script fails, the deployment will be aborted before uploading. If a `post_deploy` script fails, the deployment will have already been uploaded, but the command will exit with an error.

:::

## Configuration format

Deployment hooks are configured in your `scloud.yaml` file under the `project.scripts` section. You can specify scripts in two formats:

### Single script (string)

For a single command, use a string:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy: serverpod run flutter_build
    post_deploy: echo "Deployment complete"
```

### Multiple scripts (array)

For multiple commands, use an array:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy:
      - serverpod generate
      - serverpod run flutter_build
    post_deploy:
      - echo "Deployment uploaded successfully"
      - curl -X POST https://api.example.com/webhook
```

## Examples

### Building Flutter apps

A common use case is building Flutter applications before deployment:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy: serverpod run flutter_build
```

This ensures your Flutter web app is built and ready before the deployment package is created.

### Code generation and building

Generate code and build your Flutter app:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy:
      - serverpod generate
      - serverpod run flutter_build
```

### Post-deployment notifications

Send a notification after successful deployment:

```yaml
project:
  projectId: my-project
  scripts:
    post_deploy: |
      curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
        -H 'Content-Type: application/json' \
        -d '{"text":"Deployment successful!"}'
```

### Complex pre-deploy workflow

Run multiple preparation steps:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy:
      - echo "Starting deployment preparation..."
      - serverpod generate
      - serverpod run flutter_build
      - echo "Preparation complete"
```

## Important considerations

### Script execution environment

- Scripts are executed in your project directory (the directory containing `scloud.yaml`).
- Scripts run using the system shell.
- Each script in an array is executed sequentially.
- Scripts have access to the same environment as your terminal.

### Error handling

- If any `pre_deploy` script fails (exits with non-zero status), the deployment is aborted.
- If any `post_deploy` script fails, the deployment has already been uploaded, but the command will exit with an error.
- Script output (stdout and stderr) is displayed in the terminal during execution.

### Script dependencies

- Ensure all commands and tools used in your hooks are available in your environment.
- Scripts should be idempotent when possible (safe to run multiple times).
- Consider using absolute paths for commands if there might be PATH issues.

### Best practices

1. **Keep scripts simple**: Complex logic should be in your application code or separate build scripts.
2. **Test locally**: Run your hook commands manually before adding them to `scloud.yaml`.
3. **Use arrays for multiple steps**: This makes it easier to see what's happening and debug issues.
4. **Document your hooks**: Add comments in your `scloud.yaml` or project README explaining why hooks are needed.
5. **Handle failures gracefully**: Consider what happens if a script fails and plan accordingly.

## Troubleshooting

### Script not running

- Verify the script syntax in `scloud.yaml` is correct (YAML format).
- Check that the script path is correct if using file paths.
- Ensure the command is available in your PATH.

### Script fails during deployment

- Run the script manually in your project directory to test it.
- Check the error output in the terminal.
- Verify all dependencies and tools are installed.
- Consider adding error handling or validation to your scripts.

### Script output not visible

- Script output is displayed in real-time during deployment.
- Use `scloud deploy --verbose` for more detailed output
- Check that your script is actually producing output (some commands may be silent).

## Related documentation

- [Deploying Your Application](./01-deploying-your-application.md) - Learn about the deployment process
- [Configuration Overview](/cloud/guides/passwords) - Overview of secrets, variables, and passwords
