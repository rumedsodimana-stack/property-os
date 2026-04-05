import subprocess
import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python3 scripts/send_gmail_message_cdp.py <to> <subject> <body_file>")
        return 1

    root = Path(__file__).resolve().parents[1]
    command = [
        "/opt/homebrew/bin/node",
        str(root / "scripts" / "send_gmail_message_cdp_node.mjs"),
        *argv,
    ]
    result = subprocess.run(command, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
