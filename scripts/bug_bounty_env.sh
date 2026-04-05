#!/bin/zsh

# Local bug bounty shell environment for authorized testing only.

export HOMEBREW_PREFIX="/opt/homebrew"
export PATH="$HOMEBREW_PREFIX/bin:$HOMEBREW_PREFIX/sbin:$PATH"

export BUG_BOUNTY_HOME="/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/bugbounty"
export BUG_BOUNTY_VENV="$BUG_BOUNTY_HOME/.venv"

mkdir -p "$BUG_BOUNTY_HOME/notes" "$BUG_BOUNTY_HOME/results" "$BUG_BOUNTY_HOME/scopes"

if [[ -d "$BUG_BOUNTY_VENV" && -f "$BUG_BOUNTY_VENV/bin/activate" ]]; then
  source "$BUG_BOUNTY_VENV/bin/activate"
fi

echo "Bug bounty environment loaded."
echo "Workspace: $BUG_BOUNTY_HOME"
echo "Python: $(command -v python3)"
echo "Tools: $(command -v amass) | $(command -v nmap) | $(command -v ffuf) | $(command -v gh)"
