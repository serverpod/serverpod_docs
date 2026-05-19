# Deploying your application

Serverpod Cloud makes it easy to deploy your Serverpod applications with a single command. You can also perform dry runs to validate your deployment package without actually deploying it.

### Generating code before deployment

Before deploying your application, you should always generate your code to ensure all your models and endpoints are up to date:

```bash
serverpod generate
```

### Standard deployment

To deploy your application to Serverpod Cloud:

```bash
scloud deploy
```

The CLI will:

1. Package your application
2. Upload it to Serverpod Cloud
3. Start the deployment process
4. Provide URLs to access your application when ready

#### Successful deployment

After a successful deployment, you'll see a message like:

```text
Project uploaded successfully! 🚀

When the server has started, you can access it at:
Web:      https://my-app.serverpod.space/
API:      https://my-app.api.serverpod.space/
Insights: https://my-app.insights.serverpod.space/

See the `scloud domain` command to set up a custom domain.
```

### Performing a dry run

A dry run lets you validate your deployment package without actually deploying it:

```bash
scloud deploy --dry-run
```

This will:

- Package your application
- Validate the package contents
- Skip the actual upload and deployment

### Getting more deployment insights

For detailed information during deployment:

```bash
scloud deploy --verbose
```

This shows detailed error messages if something goes wrong.

### Viewing the file tree

To see a visual representation of the file tree that will be uploaded:

```bash
scloud deploy --show-files
```

This displays a tree structure showing all files that will be included in the deployment, as well as files that are ignored (marked with "(ignored)").

### Controlling concurrency

You can control how many files are zipped concurrently during packaging:

```bash
scloud deploy --concurrency 5
```

Higher concurrency can speed up deployments.

### Checking deployment status

Check the status of your most recent deployment:

```bash
scloud deployment show
```

List all deployments:

```bash
scloud deployment list
```

When listing all deployments, you'll see output similar to this:

```text
# | Project | Deploy Id                            | Status  | Started             | Finished            | Info                              
--+---------+--------------------------------------+---------+---------------------+---------------------+-----------------------------------
0 | my-app  | 3bbb0189-784b-4b9b-a3d9-c84f4c787f54 | FAILURE | 2025-03-28 13:42:38 | 2025-03-28 13:43:33 | User build FAILURE - see build log
1 | my-app  | 4a60a5ec-067c-4c76-8ecd-30a6410c1dc2 | SUCCESS | 2025-03-27 15:24:57 | 2025-03-27 15:27:50 |                                   
2 | my-app  | 73e66b41-64fc-4920-b6ef-4918cc6ceca1 | FAILURE | 2025-03-27 15:19:37 | 2025-03-27 15:20:34 | User build FAILURE - see build log
3 | my-app  | 4bb1e636-3ec8-4f78-b294-32c80efd513a | SUCCESS | 2025-03-27 10:12:36 | 2025-03-27 10:19:48 |                                   
```

View detailed logs for a specific deployment using its ID:

```bash
scloud deployment show 73e66b41-64fc-4920-b6ef-4918cc6ceca1
```

### Managing deployment files

The `.scloudignore` file lets you control which files are included in your deployment package, using syntax similar to `.gitignore`:

- By default, any files ignored by `.gitignore` are also excluded from your deployment
- To include files that are ignored by `.gitignore`, prefix the pattern with `!` in your `.scloudignore` file

#### Adding to .gitignore

Deployment may generate files which are placed in directories named `.scloud`.
These should not be committed to version control, which can be avoided by adding this to your root .gitignore:

```
# scloud deployment generated files
**/.scloud/
```

#### Syntax and examples

```text
# Comments start with a hash
/specific_file.txt      # Exclude a specific file
*.log                   # Exclude all log files
/large_dir/             # Exclude a directory and its contents

# Override .gitignore rules
!lib/src/generated/     # Include all generated code, even if ignored by .gitignore
```

Verify your ignore patterns are working as expected:

```bash
scloud deploy --dry-run --show-files
```

This will show you the file tree without actually deploying, so you can verify which files are included or excluded.

## 💡 Best Practices

- **Use `.scloudignore`**: Exclude unnecessary files from your deployment package
- **Add `**/.scloud/` to .gitignore**: Exclude generated deployment files from your git repository
- **Use version control**: Commit your code before deploying to ensure you can rollback if needed
- **Check deployment status**: Use `scloud deployment show` to monitor your deployment
- **Use deployment hooks**: Automate build steps and post-deployment tasks with `pre_deploy` and `post_deploy` hooks (see [Deployment Hooks](./04-deployment-hooks.md))

## Troubleshooting

If your deployment fails:

- Check the deployment status:

   ```bash
   scloud deployment show
   ```

- View build logs for the latest deployment:

   ```bash
   scloud deployment build-log
   ```

### Common build failures

| Error Type | Possible Causes | Solution |
|------------|-----------------|----------|
| Package resolution | Missing dependencies | Update your `pubspec.yaml` file |
| Build errors | Code compilation issues | Fix the code errors shown in logs |

> **Tip:** Look for lines starting with "ERROR:" or "FAILED:" in the build logs for quick troubleshooting.

## Related documentation

- [Deployment Hooks](./04-deployment-hooks.md) - Automate build steps and post-deployment tasks
- [Handling Private Dependencies](./02-handling-private-dependencies.md) - Manage private package dependencies
- [Assets](./03-assets.md) - Include static assets in your deployment
- [GitHub Automation](./06-github-automation.md) - Automate Serverpod Cloud deployment using GitHub actions
