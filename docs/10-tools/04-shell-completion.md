# Command line completion

As a `serverpod` user, you can enable command line completion in most shells. The Serverpod CLI supports completion through [Carapace](https://carapace.sh/), which provides tab-completion for commands, options, and their values in bash, zsh, fish, PowerShell, and more.

## Installing completion

### Prerequisites

Install [Carapace](https://carapace.sh/) for your platform:

**macOS:**

```bash
brew install carapace
```

**Ubuntu/Debian:**

```bash
sudo apt install carapace-bin
```

**Windows:**

```powershell
winget install carapace
```

For other platforms, see the [Carapace installation guide](https://carapace-sh.github.io/carapace-bin/install.html).

### Enable Carapace completion for Serverpod

#### Bash

Install the completion spec:

```bash
serverpod completion install --tool carapace
```

Then add the following to your `~/.bashrc` to enable Carapace:

```bash
source <(carapace _carapace)
```

Restart your shell or run `source ~/.bashrc` to apply.

#### Zsh

Install the completion spec:

```bash
serverpod completion install --tool carapace
```

Then add the following to your `~/.zshrc` to enable Carapace:

```bash
zstyle ':completion:*' format $'\e[2;37mCompleting %d\e[m'
source <(carapace _carapace)
```

Restart your shell or run `source ~/.zshrc` to apply.

#### Other shells

Carapace supports fish, PowerShell, elvish, and more. After installing the completion spec with `serverpod completion install --tool carapace`, see the [Carapace setup documentation](https://carapace-sh.github.io/carapace-bin/setup.html) for instructions specific to your shell.

## Alternative: Completely

The Serverpod CLI also supports [Completely](https://github.com/bashly-framework/completely), a lightweight alternative to Carapace that supports bash and zsh. Unlike Carapace, Completely does not require a separate tool running in your shell — it generates a standalone bash completion script.

To generate a Completely spec and create a completion script:

```bash
serverpod completion generate --tool completely -f serverpod.yaml
completely generate serverpod.yaml serverpod.bash
```

Then source the generated script in your shell config (e.g., `source /path/to/serverpod.bash` in `~/.bashrc` or `~/.zshrc`).

:::note
Carapace is the recommended tool as it supports a wider range of shells and comes with a pre-built completion spec that can be installed directly with `serverpod completion install`. Completely requires generating and processing the script manually.
:::
