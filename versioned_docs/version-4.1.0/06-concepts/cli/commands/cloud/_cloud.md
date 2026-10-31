# serverpod cloud

`serverpod cloud` forwards everything after it to the Serverpod Cloud CLI (`scloud`), so you can manage Serverpod Cloud projects without installing `scloud` separately. For example, `serverpod cloud deploy` runs `scloud deploy`.

- **Install:** If `scloud` is missing, `serverpod cloud` installs it with `dart install serverpod_cloud_cli`. An existing `scloud` from `dart install` or `dart pub global activate` is reused.
- **Updates:** If the Cloud CLI updates itself, `serverpod cloud` runs your command again with the new version. If the Cloud CLI needs a required update it can't install on its own, `serverpod cloud` installs the update and then runs your command again.
- **Terminal:** The Cloud CLI shares your terminal, so prompts and browser sign-in work as usual. Its messages show `serverpod cloud` as the command name.
- **Exit code:** The command exits with the Cloud CLI's exit code, so scripts can check the result.

For the full set of Cloud commands and options, see the [Serverpod Cloud CLI reference](/cloud/reference/cli/introduction).
