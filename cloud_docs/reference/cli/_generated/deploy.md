## Usage

```console
Deploy a Serverpod project to the cloud.

Usage: scloud deploy [arguments]
-h, --help                     Print this usage information.
-p, --project (mandatory)      The ID of the project. Can be passed as the first argument.
                               Can be omitted for existing projects that are linked. See `scloud
                               project link --help`.
-c, --concurrency=<integer>    Number of concurrent files processed when zipping the project.
                               (defaults to "5")
    --dry-run                  Do not actually deploy, just print the deployment steps.
    --show-files               Display the file tree that will be uploaded.
-o, --output                   Save the deployment zip file to the specified path. Must end with
                               .zip
    --dart-version             Overrides the Dart SDK version to use for building the project.

Run "scloud help" to see global options.


Examples

  Deploy your project to the cloud

    $ scloud deploy

  Preview the file tree that will be uploaded

    $ scloud deploy --show-files

  The output shows files that will be included in the deployment, as well as files that are ignored
  (marked with "(ignored)").

  This is useful for verifying that your .gitignore and .scloudignore files are working as expected.
  You can combine it with --dry-run to preview the file tree without actually deploying:

    $ scloud deploy --dry-run --show-files

  Save the deployment zip file locally

    $ scloud deploy --output deployment.zip --dry-run

  Save the deployment zip and still upload it (unless --dry-run is set)

    $ scloud deploy --output deployment.zip


See the full documentation at: /cloud/reference/cli/commands/deploy

```

