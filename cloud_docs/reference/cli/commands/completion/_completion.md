# Command line completion

As an `scloud` user, you can enable command line completion in most shells.

Two completion tools are supported, _completely_ and _carapace_.

Completely is easier to set up for the end user, but only has direct support
for bash and zsh.
See also: https://github.com/bashly-framework/completely

Carapace supports nearly all shells but requires the end user to install
the carapace tool.
See also: https://carapace.sh/

## Installing completion

### Bash with Completely

Run:
```sh
scloud completion install -t completely
```

This will write the completions script to this location, where bash picks it up
automatically on start:
`~/.local/share/bash-completion/completions/scloud.bash`

In order to update the completions in the current bash shell, run:

```sh
exec bash
```

### Zsh with Completely

Run the same as for bash:
```sh
scloud completion install -t completely
```

Then set up bash completions for your Zsh:

If you use Oh-My-Zsh, bash completions are already enabled.
Otherwise, enable them by adding the following to your `~/.zshrc`
(if not already present):

```sh
autoload -Uz +X compinit && compinit
autoload -Uz +X bashcompinit && bashcompinit
```

Then, enable `scloud` completions by adding this line to your `~/.zshrc`
(for all setups, including Oh-My-Zsh):

```sh
source ~/.local/share/bash-completion/completions/scloud.bash
```

### Nearly all shells with Carapace

Carapace supports nearly all shells but requires the end user to install
the carapace tool.
See also: https://carapace.sh/

#### Prerequisites

To install `carapace` on macOS:

```sh
brew install carapace
```

For installing in other environments, see:
https://carapace-sh.github.io/carapace-bin/install.html

#### Enable carapace completion for scloud

Run the following once for the current shell,
or add to your shell startup script:

Bash:
```bash
scloud completion install -t carapace
source <(carapace scloud)
```

Zsh:
```zsh
scloud completion install -t carapace
zstyle ':completion:*' format $'\e[2;37mCompleting %d\e[m'
source <(carapace scloud)
```

For more information and installing in other shells, see:
https://carapace-sh.github.io/carapace-bin/setup.html
