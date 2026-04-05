#!/bin/zsh

set -euo pipefail

source "/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bug_bounty_env.sh" >/dev/null

echo "== Workspace =="
echo "$BUG_BOUNTY_HOME"
echo

echo "== Toolchain =="
for tool in python3 uv node go gh amass nmap ffuf sqlmap nikto git curl jq; do
  if command -v "$tool" >/dev/null 2>&1; then
    echo "$tool: $(command -v "$tool")"
  else
    echo "$tool: MISSING"
  fi
done
echo

echo "== Versions =="
python3 --version
uv --version
node --version
go version
gh --version | head -n 1
nmap --version | head -n 1
/opt/homebrew/bin/ffuf -V | head -n 1
sqlmap --version
nikto -Version
amass -help >/dev/null 2>&1 && echo "amass: available"
echo

echo "== Workspace Directories =="
ls -1 "$BUG_BOUNTY_HOME"
