# serverpod doctor

The `serverpod doctor` command checks that Flutter, Dart, Git, and the Serverpod CLI are installed in compatible versions and selected by your `PATH`, and that pub.dev is reachable. For each check that fails, it prints what to do about it.

The command exits with an error when any check fails. Pass `--json` to get the results as JSON, for example in a script.
