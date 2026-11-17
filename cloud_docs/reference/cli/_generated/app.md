## Usage

```console
Publish and follow the apps of a Serverpod project.

Usage: scloud app <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  artifacts   Show download links for the files built from an app upload. Links expire in ten
              minutes.
  cancel      Request cancellation of the active builds of an app upload.
  doctor      Check whether the Flutter app is set up to be published: its Flutter version, the
              setup of each platform in the console, app identifiers, Android release signing, iOS
              export compliance, and app icons. Exits with an error status when a check fails.
  list        List recent app publishes, newest first.
  log         Show the build log of an app upload for one platform. By default, watch for step logs
              until the build ends. Use --no-watch to print the available logs and exit.
  publish     Upload the Flutter app to be built and published. An app in a Dart workspace is
              uploaded with its workspace dependencies.
  setup       Set up the Flutter app to be published. For each platform, checks the app identifier
              and asks for a new one when the app uses the Flutter default, unless
              --android-package-name or --ios-bundle-id sets it, then records it on Serverpod Cloud.
              For Android, also checks the release signing. Exits with an error status when a check
              fails.
  show        Show the builds of an app upload. Follows their progress until they end.
  status      Show the latest build of each platform with a connected store.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

### Sub commands

#### `setup`

```console
Set up the Flutter app to be published. For each platform, checks the app identifier and asks for a
new one when the app uses the Flutter default, unless --android-package-name or --ios-bundle-id sets
it, then records it on Serverpod Cloud. For Android, also checks the release signing. Exits with an
error status when a check fails.

Usage: scloud app setup [arguments]
-h, --help                           Print this usage information.
-p, --project (mandatory)            The ID of the project.
                                     Can be omitted for existing projects that are linked (see the
                                     "project link" command).
    --app-dir                        The path to the Flutter app directory. Defaults to
                                     project.app.dir in scloud.yaml, the current Flutter app, or the
                                     Flutter app in the server's workspace or near the server
                                     directory.
    --platforms=<android,ios>        The platforms to set up, separated by commas. Defaults to the
                                     supported platforms the app has code for. Supported platforms:
                                     android, ios.
    --android-package-name=<name>    The Android package name to publish the app with. Replaces the
                                     one the app declares, without a prompt.
    --ios-bundle-id=<id>             The iOS bundle ID to publish the app with. Replaces the one the
                                     app declares, without a prompt.

Run "scloud help" to see global options.


Examples

  Set up the Flutter app of your project

    $ scloud app setup

  Set up only the Android app

    $ scloud app setup --platforms android

  Set up the app without prompts, as in CI or for an agent

    $ scloud app setup --non-interactive --android-package-name com.acme.app --ios-bundle-id
    com.acme.app

  Set up a Flutter app in a specific directory

    $ scloud app setup --app-dir my_project_flutter


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `doctor`

```console
Check whether the Flutter app is set up to be published: its Flutter version, the setup of each
platform in the console, app identifiers, Android release signing, iOS export compliance, and app
icons. Exits with an error status when a check fails.

Usage: scloud app doctor [arguments]
-h, --help                         Print this usage information.
-p, --project (mandatory)          The ID of the project.
                                   Can be omitted for existing projects that are linked (see the
                                   "project link" command).
    --app-dir                      The path to the Flutter app directory. Defaults to
                                   project.app.dir in scloud.yaml, the current Flutter app, or the
                                   Flutter app in the server's workspace or near the server
                                   directory.
    --platforms=<android,ios>      The platforms to check, separated by commas. Defaults to the
                                   supported platforms the app has code for. Supported platforms:
                                   android, ios.
    --flutter-version=<version>    The Flutter release version to check the app against, as "app
                                   publish --flutter-version" would build it. Defaults to the single
                                   version the app's pubspec.yaml requires, or else to
                                   project.app.flutterSdk in scloud.yaml, or else to the version of
                                   the local Flutter SDK. Without any of them, the build uses the
                                   latest stable release.

Run "scloud help" to see global options.


Examples

  Check the Flutter app of your project

    $ scloud app doctor

  Check only the iOS setup

    $ scloud app doctor --platforms ios

  Check the app as it would be built with a specific Flutter version

    $ scloud app doctor --flutter-version 3.50.0

  Check a Flutter app in a specific directory

    $ scloud app doctor --app-dir my_project_flutter


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `publish`

```console
Upload the Flutter app to be built and published. An app in a Dart workspace is uploaded with its
workspace dependencies.

Usage: scloud app publish [arguments]
-h, --help                            Print this usage information.
-p, --project (mandatory)             The ID of the project. Can be passed as the first argument.
                                      Can be omitted for existing projects that are linked (see the
                                      "project link" command).
    --app-dir                         The path to the Flutter app directory. Defaults to
                                      project.app.dir in scloud.yaml, the current Flutter app, or
                                      the Flutter app in the server's workspace or near the server
                                      directory.
    --platforms=<android,ios>         The platforms to publish, separated by commas. The code of the
                                      other platforms is left out of the upload. Defaults to the
                                      supported platforms the app has code for and that are set up.
                                      Supported platforms: android, ios.
    --flutter-version=<version>       The Flutter release version to build the app with. Defaults to
                                      the single version the app's pubspec.yaml requires, or else to
                                      project.app.flutterSdk in scloud.yaml, or else to the version
                                      of the local Flutter SDK, or else to the latest stable
                                      release.
    --dart-define=<key=value>         A dart define to build the app with, as KEY=VALUE. Can be
                                      repeated. Replaces the value of the same key from a dart
                                      defines file. SERVER_URL is always set by Serverpod Cloud.
    --dart-define-from-file=<path>    A file in JSON or .env format with dart defines to build the
                                      app with. Can be repeated; a later file replaces the values of
                                      an earlier one. Defaults to project.app.dartDefineFromFile in
                                      scloud.yaml.
    --[no-]await                      Await the builds to finish while showing their progress, and
                                      their build logs on an interactive terminal.
                                      (defaults to on)
    --show-files                      Display the file tree that will be uploaded.
    --wet-run                         Prepare the app archive without uploading or starting builds.
-o, --output                          Save the app archive to a path ending in .zip.

Run "scloud help" to see global options.


Examples

  Publish the Flutter app of your project

    $ scloud app publish

  Publish only the Android app

    $ scloud app publish --platforms android

  Publish the app built with a specific Flutter version

    $ scloud app publish --flutter-version 3.50.0

  Publish the app built with dart defines

    $ scloud app publish --dart-define-from-file .env --dart-define FLAVOR=production

  Publish the app without waiting for its builds to finish

    $ scloud app publish --no-await

  Publish a Flutter app in a specific directory

    $ scloud app publish --app-dir my_project_flutter


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `show`

```console
Show the builds of an app upload. Follows their progress until they end.

Usage: scloud app show [arguments]
-h, --help                     Print this usage information.
-p, --project (mandatory)      The ID of the project.
                               Can be omitted for existing projects that are linked (see the
                               "project link" command).
    --upload-id (mandatory)    The id of the app upload, as printed by app publish or app list. Can
                               be passed as the first argument.

Run "scloud help" to see global options.


Examples

  Show the builds of an app upload by the upload id that app publish or app list printed

    $ scloud app show 3f2b0c4e-1d5a-4b8e-9c7f-2a6d8e1b4c90


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `list`

```console
List recent app publishes, newest first.

Usage: scloud app list [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project. Can be passed as the first argument.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command).
    --platforms=<android,ios>    The platforms to list the builds of, separated by commas. Lists one
                                 row per build instead of one row per publish.
    --limit=<integer>            The maximum number of rows to list.
                                 (defaults to "10")
-u, --[no-]utc                   Display timestamps in UTC timezone instead of local. Set
                                 SERVERPOD_CLOUD_DISPLAY_UTC=true to make UTC the default for all
                                 commands.

Run "scloud help" to see global options.


Examples

  List the 10 most recent publishes

    $ scloud app list

  List the 20 most recent iOS builds

    $ scloud app list --platforms ios --limit 20

  List the most recent builds of each platform

    $ scloud app list --platforms ios,android


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `status`

```console
Show the latest build of each platform with a connected store.

Usage: scloud app status [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project. Can be passed as the first argument.
                             Can be omitted for existing projects that are linked (see the "project
                             link" command).
-u, --[no-]utc               Display timestamps in UTC timezone instead of local. Set
                             SERVERPOD_CLOUD_DISPLAY_UTC=true to make UTC the default for all
                             commands.

Run "scloud help" to see global options.


Examples

  Show the latest build of each connected platform

    $ scloud app status


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `log`

```console
Show the build log of an app upload for one platform. By default, watch for step logs until the
build ends. Use --no-watch to print the available logs and exit.

Usage: scloud app log [arguments]
-h, --help                      Print this usage information.
-p, --project (mandatory)       The ID of the project.
                                Can be omitted for existing projects that are linked (see the
                                "project link" command).
    --upload-id (mandatory)     The id of the app upload, as printed by app publish or app list. Can
                                be passed as the first argument.
    --platform=<android|ios>    The platform of the build to stream the log of. Defaults to the only
                                platform of the upload.
    --[no-]watch                Wait for new step logs until the build ends. Use --no-watch to print
                                the available logs and exit.
                                (defaults to on)

Run "scloud help" to see global options.


Examples

  Stream the iOS build log of an app upload by the upload id that app publish or app list printed

    $ scloud app log 3f2b0c4e-1d5a-4b8e-9c7f-2a6d8e1b4c90 --platform ios

  Print the logs currently available and exit

    $ scloud app log 3f2b0c4e-1d5a-4b8e-9c7f-2a6d8e1b4c90 --platform ios --no-watch


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `cancel`

```console
Request cancellation of the active builds of an app upload.

Usage: scloud app cancel [arguments]
-h, --help                     Print this usage information.
-p, --project (mandatory)      The ID of the project.
                               Can be omitted for existing projects that are linked (see the
                               "project link" command).
    --upload-id (mandatory)    The id of the app upload, as printed by app publish or app list. Can
                               be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```

#### `artifacts`

```console
Show download links for the files built from an app upload. Links expire in ten minutes.

Usage: scloud app artifacts [arguments]
-h, --help                     Print this usage information.
-p, --project (mandatory)      The ID of the project.
                               Can be omitted for existing projects that are linked (see the
                               "project link" command).
    --upload-id (mandatory)    The id of the app upload, as printed by app publish or app list. Can
                               be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/app

```
