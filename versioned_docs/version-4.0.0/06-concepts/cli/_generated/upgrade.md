## Usage

```console
Upgrade the Serverpod CLI to the latest version.

Usage: serverpod upgrade [arguments]
-h, --help                 Print this usage information.
    --channel              Which published versions to consider. Defaults to following prereleases when a prerelease is installed, and stable releases otherwise.

          [stable]         Only install stable releases
          [any]            Install the newest version, including prereleases

    --version=<version>    Install a specific version instead of the newest one in the channel. This is the only way to move the installation backwards.
-f, --force                Install even when the installed version is already the target, or when the CLI being run is not the one that would be replaced.

Run "serverpod help" to see global options.
```

