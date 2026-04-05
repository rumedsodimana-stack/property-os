#!/bin/zsh

set -euo pipefail

source "/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bug_bounty_env.sh" >/dev/null

if [[ ! -d "$BUG_BOUNTY_VENV" ]]; then
  uv venv "$BUG_BOUNTY_VENV"
fi

uv pip install \
  --python "$BUG_BOUNTY_VENV/bin/python" \
  beautifulsoup4 \
  dnspython \
  httpx \
  python-dotenv \
  pyyaml \
  requests \
  rich

echo
echo "Bootstrap complete."
echo "Workspace: $BUG_BOUNTY_HOME"
echo "Virtualenv: $BUG_BOUNTY_VENV"
echo "Python: $BUG_BOUNTY_VENV/bin/python"
