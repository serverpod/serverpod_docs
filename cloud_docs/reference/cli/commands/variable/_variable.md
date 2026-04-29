# `variable`

The `scloud variable` command provides management of environment variables for your Serverpod Cloud projects.

To add an environment variable, use the `create` command:

```bash
scloud variable create MY_VAR myvalue
```

:::note
Some limitations to keep in mind:

- Environment variable names can only contain lowercase letters `a-z`, uppercase letters `A-Z`, digits `0-9` and underscore `_` for separation. The name has to start with a letter.
- Maximum name length is `255`.
- The maximum total size of all environment variables cannot exceed `64kB`.

:::

