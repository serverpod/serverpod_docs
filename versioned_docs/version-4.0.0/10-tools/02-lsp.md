---
description: The Serverpod language server gives editors diagnostics, go to definition, and find references for model files, via the VS Code extension or the LSP command.
---

# LSP server

The [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) is a standardized protocol designed to provide development environments with language-specific functionalities. Serverpod's language server understands your model files (`.spy.yaml`, `.spy.yml`, and `.spy`) and gives your editor:

- **Diagnostics.** Errors in model files are reported as you type, and refreshed when files change on disk, for example after a `git checkout`.
- **Go to definition.** In a model file, Ctrl+Click (Cmd+Click on macOS) on a name jumps to the model, enum, or field it refers to, including models from modules and tables referenced through `relation(parent=...)`.
- **Find references.** Lists where a model, table, or field is used in other model files. Usages in Dart code are reported by the Dart language server instead.

To start the Serverpod LSP server for an editor that speaks LSP, use the following command:

```bash
$ serverpod language-server
```

:::info
If you use [VS Code](https://code.visualstudio.com/) you can instead use the [Serverpod extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod). It starts the language server for you and needs the `serverpod` command on your `PATH`.
:::

## Navigate from Dart code

The VS Code extension also links generated Dart classes back to their model files. Go to definition on a model class in Dart code offers its model file alongside the generated class, and the **Serverpod: Go to Model Definition** command (Ctrl+Alt+F12, Cmd+Alt+F12 on macOS) jumps straight to it.

The extension attaches only to the `.spy.yaml`, `.spy.yml`, and `.spy` extensions, which are the only model file names Serverpod 4 accepts. Plain `.yaml` files get no diagnostics or navigation.
