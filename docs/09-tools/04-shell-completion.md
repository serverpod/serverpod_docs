# Command line completion

As a `serverpod` user, you can enable command line completion in most shells. The Serverpod CLI supports completion through [Carapace](https://carapace.sh/), which provides tab-completion for commands, options, and their values in bash, zsh, fish, PowerShell, and more.

## Installing completion

### Prerequisites

Install Carapace for your platform:

```bash
brew install carapace
```

For other platforms, see the [Carapace installation guide](https://carapace-sh.github.io/carapace-bin/install.html).

### Enable Carapace completion for Serverpod

#### Bash

Install the completion spec and enable Carapace in your shell:

```bash
serverpod completion install --tool carapace
source <(carapace serverpod)
```

To make this permanent, add `source <(carapace _carapace)` to your `~/.bashrc`.

#### Zsh

Install the completion spec and enable Carapace in your shell:

```bash
serverpod completion install --tool carapace
zstyle ':completion:*' format $'\e[2;37mCompleting %d\e[m'
source <(carapace serverpod)
```

To make this permanent, add the following to your `~/.zshrc`:

```bash
zstyle ':completion:*' format $'\e[2;37mCompleting %d\e[m'
source <(carapace _carapace)
```

#### Other shells

Carapace supports fish, PowerShell, elvish, and more. After installing the completion spec with `serverpod completion install --tool carapace`, see the [Carapace setup documentation](https://carapace-sh.github.io/carapace-bin/setup.html) for instructions specific to your shell.
