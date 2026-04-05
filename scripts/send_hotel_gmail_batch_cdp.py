import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS_PATH = ROOT / "docs" / "ops" / "hotel_target_list_2026-03-31.json"
OUTREACH_LOG = ROOT / "docs" / "ops" / "outreach_actions.csv"
SENDER_SCRIPT = ROOT / "scripts" / "send_gmail_message_cdp.py"


def build_message(target: dict) -> str:
    return f"""Hi {target['company']} team,

{target['personalization']}

I build hotel-specific AI pilots that help properties capture reservation demand after hours, answer repeat guest questions faster, route service requests into operations, and surface paid upsells like early check-in, room upgrades, late checkout, breakfast, parking, and spa add-ons.

I already have a hotel operations stack running with concierge logic, guest request routing, payments, and property workflows. I am offering a fixed-scope 14-day pilot for groups that want a faster path to direct revenue and reduced front desk load without a long implementation cycle.

For {target['company']}, I would position this as a {target['pitch_angle'].lower()}.

If useful, I can send a short 3-point pilot outline tailored to your properties this week.

Best,
Rumed Sodimana
"""


def append_log(company: str, action: str, status: str, notes: str) -> None:
    with OUTREACH_LOG.open("a", encoding="utf-8") as handle:
        handle.write(f"2026-03-31,gmail,{company},{action},{status},{notes}\n")


def send_one(target: dict) -> tuple[bool, str]:
    body_file = ROOT / "tmp" / f"gmail_{target['company'].lower().replace(' ', '_').replace('&', 'and')}.txt"
    body_file.parent.mkdir(parents=True, exist_ok=True)
    body_file.write_text(build_message(target), encoding="utf-8")

    subject = f"{target['company']}: quick idea to recover missed reservations and upsells"
    command = [
        sys.executable,
        str(SENDER_SCRIPT),
        target["contact_email"],
        subject,
        str(body_file),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode == 0:
        return True, (result.stdout.strip() or "Gmail send succeeded")
    note = result.stderr.strip() or result.stdout.strip() or "Gmail send failed"
    return False, note.replace(",", ";")


def main() -> None:
    targets = json.loads(TARGETS_PATH.read_text(encoding="utf-8"))
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    selected = targets[start : start + count]

    for target in selected:
        ok, note = send_one(target)
        status = "sent" if ok else "failed"
        append_log(target["company"], "gmail_sent", status, note)
        print(f"{status.upper()} | {target['company']} | {note}")


if __name__ == "__main__":
    main()
