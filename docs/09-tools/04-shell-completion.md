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
