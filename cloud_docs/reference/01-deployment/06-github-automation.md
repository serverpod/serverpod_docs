# Deploying using GitHub Actions

The [serverpod-cloud-deploy][] action can be used to automatically deploy projects on GitHub to Serverpod Cloud.

[serverpod-cloud-deploy]: https://github.com/marketplace/actions/serverpod-cloud-deploy


## Usage

This is a simple GitHub workflow example that uses this action.

```yml
name: Automated Serverpod Cloud deploy

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter SDK
        uses: subosito/flutter-action@v2

      - name: Activate serverpod command
        run: dart pub global activate serverpod_cli
        # Note: Does not pin the serverpod version, which you may want to do.

      - uses: serverpod/serverpod-cloud-deploy@v1
        with:
          token: ${{ secrets.MY_SERVERPOD_CLOUD_ACCESS_TOKEN }}
```

Prerequisites:
  * A GitHub secret has been set containing the access token
    > (create a token with `scloud auth create-token`)

  * `serverpod generate` has been run and the generated files are committed
    (or `serverpod generate` is included as a predeploy script in in `scloud.yaml`)

  * `scloud.yaml` is committed in the server package
    > (create this file with `scloud launch` or `scloud link`)

  * The repository has only one Serverpod project and it is no more than two
    subdirectory levels down from the root


## Inputs

The action takes the following inputs:

- Required:

  * `token`: Serverpod Cloud access token.

- Optional:
  * `working_directory`: Path to the action's working directory.
    Default value is `.`

  * `project_id`: Cloud project ID.

  * `project_dir`: Path to the project's server directory.

  * `project_config_file`: Path to the project's configuration file.


## Combine with serverpod generate

The following workflow example does not require the generated serverpod files
to be committed nor the scloud.yaml file to be available.

```yml
name: Automated Serverpod Cloud generate & deploy
# Checks out the repository, sets up Flutter, runs serverpod generate,
# and deploys to Serverpod Cloud.

on:
  push:
    branches: ["master","main"]

permissions:
  contents: read

env:
  # Change these values according to your project
  PROJECT_ID: my-project-id
  SERVER_DIR: ./packages/my_server
  CLOUD_TOKEN: ${{ secrets.MY_SERVERPOD_CLOUD_ACCESS_TOKEN }}

jobs:
  generate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter SDK
        uses: subosito/flutter-action@v2

      - name: Run serverpod generate
        working-directory: ${{ env.SERVER_DIR }}
        run: |
          dart pub get
          dart pub global activate serverpod_cli
          serverpod generate
          # (generation can also be included as a predeploy script in in `scloud.yaml`)

      - uses: serverpod/serverpod-cloud-deploy@v1
        with:
          token: ${{ env.CLOUD_TOKEN }}
          project_id: ${{ env.PROJECT_ID }}
          project_dir: ${{ env.SERVER_DIR }}
```
