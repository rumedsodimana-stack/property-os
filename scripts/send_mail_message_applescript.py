import argparse
import subprocess
import sys
from pathlib import Path


def applescript_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Send an email via Apple Mail using an existing configured account."
    )
    parser.add_argument("to_email")
    parser.add_argument("subject")
    parser.add_argument("body_file")
    parser.add_argument(
        "--sender",
        default="rumedsodimana95@icloud.com",
        help="Configured Apple Mail sender address to use.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=30,
        help="AppleEvent timeout in seconds.",
    )
    args = parser.parse_args()

    body = Path(args.body_file).read_text(encoding="utf-8")
    script = f'''
with timeout of {args.timeout_seconds} seconds
tell application "Mail"
    set newMessage to make new outgoing message with properties {{subject:"{applescript_escape(args.subject)}", content:"{applescript_escape(body)}", visible:false}}
    tell newMessage
        make new to recipient at end of to recipients with properties {{address:"{applescript_escape(args.to_email)}"}}
        set sender to "{applescript_escape(args.sender)}"
        send
    end tell
end tell
end timeout
'''

    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=args.timeout_seconds + 10,
            check=False,
        )
    except subprocess.TimeoutExpired:
        print("TIMED_OUT")
        return 1

    if result.returncode != 0:
        stderr = result.stderr.strip() or result.stdout.strip() or "Apple Mail send failed"
        print(stderr)
        return 1

    print("SENT")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
