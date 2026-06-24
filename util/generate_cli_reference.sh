#!/usr/bin/env bash
#
# Generates the framework CLI reference usage blocks under
# docs/06-concepts/23-cli/_generated/ from the installed `serverpod` CLI.
#
# This mirrors how the Serverpod Cloud CLI reference is produced from
# `cli_tools`. Run it after installing the target CLI version:
#
#   dart pub global activate serverpod_cli <version>
#   util/generate_cli_reference.sh
#
# Only the _generated/*.md files are written. The hand-maintained intros
# (_<command>.md) and composer pages (<command>.mdx) are not touched.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$REPO_ROOT/docs/06-concepts/23-cli/_generated"

COMMANDS=(
  cloud
  completion
  create
  create-migration
  create-repair-migration
  generate
  language-server
  mcp-server
  quickstart
  run
  upgrade
  version
)

mkdir -p "$OUT_DIR"

# Runs a command inside a wide (200-column) pseudo-terminal so the CLI's usage
# formatter does not wrap option descriptions at the default 80 columns. This
# matches the unwrapped output the Cloud reference gets from cli_tools.
pty_run() {
  python3 - "$@" <<'PY'
import pty, os, struct, fcntl, termios, sys
args = sys.argv[1:]
pid, fd = pty.fork()
if pid == 0:
    os.execvp(args[0], args)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', 50, 200, 0, 0))
out = b''
while True:
    try:
        data = os.read(fd, 4096)
    except OSError:
        break
    if not data:
        break
    out += data
os.waitpid(pid, 0)
sys.stdout.write(out.decode(errors='replace'))
PY
}

# Strips the shared "Global options:" block (documented on its own page) and
# trailing whitespace, keeping the command-specific usage and its internal
# spacing intact.
clean_usage() {
  tr -d '\r' \
    | awk '/^Global options:/ {exit} {print}' \
    | sed -e 's/[[:space:]]*$//' \
    | awk '{a[NR]=$0} END {n=NR; while (n>0 && a[n]=="") n--; for (i=1;i<=n;i++) print a[i]}'
}

# Lists the immediate subcommand names of a command, if any.
list_subcommands() {
  pty_run serverpod help "$1" 2>&1 | tr -d '\r' \
    | awk '/Available subcommands:/ {f=1; next} /^Run "/ {f=0} f && /^  [a-z]/ {print $1}'
}

for cmd in "${COMMANDS[@]}"; do
  out="$OUT_DIR/${cmd}.md"
  {
    echo '## Usage'
    echo
    echo '```console'
    pty_run serverpod help "$cmd" 2>&1 | clean_usage
    echo '```'

    subs=$(list_subcommands "$cmd")
    if [ -n "$subs" ]; then
      echo
      echo '### Sub commands'
      while IFS= read -r sub; do
        [ -z "$sub" ] && continue
        echo
        echo "#### \`$sub\`"
        echo
        echo '```console'
        pty_run serverpod help "$cmd" "$sub" 2>&1 | clean_usage
        echo '```'
      done <<< "$subs"
    fi
  } > "$out"
  echo "wrote $out"
done

# Top-level usage, including the shared global options block and command list.
# Documented on the Global options page, so the block is kept here in full.
{
  echo '## Usage'
  echo
  echo '```console'
  pty_run serverpod help 2>&1 | tr -d '\r' | sed -e 's/[[:space:]]*$//' \
    | awk '{a[NR]=$0} END {n=NR; while (n>0 && a[n]=="") n--; for (i=1;i<=n;i++) print a[i]}'
  echo '```'
} > "$OUT_DIR/global_options.md"
echo "wrote $OUT_DIR/global_options.md"

echo "Done. Generated ${#COMMANDS[@]} command files plus global_options.md in $OUT_DIR"
