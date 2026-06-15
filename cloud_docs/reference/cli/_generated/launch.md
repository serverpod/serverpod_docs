## Usage

```console
Common command to launch and deploy Serverpod Cloud projects.

If there already is a Serverpod Cloud project near the current directory
it will redeploy the project (upload, build, and rollout in the cloud).

Otherwise it will guide you through setting up a new Serverpod Cloud project.


Usage: scloud launch [arguments]
-h, --help                     Print this usage information.
-p, --project                  The ID of the project.
    --plan=<starter|growth>    Selects the plan to use.
    --[no-]enable-db           Flag to enable the database for the project.
    --[no-]deploy              Flag to immediately deploy the project.
    --dart-version             Overrides the Dart SDK version to use for building the project.

Deployment options
-c, --concurrency=<integer>    Number of concurrent files processed when zipping the project.
                               (defaults to "5")
    --dry-run                  Do not actually deploy, just print the deployment steps.
    --show-files               Display the file tree that will be uploaded.
-o, --output                   Save the deployment zip file to the specified path. Must end with
                               .zip
    --[no-]await               Await the deployment to finish while showing status progression.
                               (defaults to on)

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/launch

```

