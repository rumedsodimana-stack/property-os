import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS_PATH = ROOT / "docs" / "ops" / "hotel_target_list_2026-03-31.json"
SIGNOFF_NAME = "Rumed Sodimana"


def applescript_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def create_draft(target: dict) -> None:
    subject = f"{target['company']}: quick idea to recover missed reservations and upsells"
    body = f"""Hi {target['company']} team,

{target['personalization']}

I build hotel-specific AI pilots that help properties capture reservation demand after hours, answer repeat guest questions faster, route service requests into operations, and surface paid upsells like early check-in, room upgrades, late checkout, breakfast, parking, and spa add-ons.

I already have a hotel operations stack running with concierge logic, guest request routing, payments, and property workflows. I am offering a fixed-scope 14-day pilot for groups that want a faster path to direct revenue and reduced front desk load without a long implementation cycle.

For {target['company']}, I would position this as a {target['pitch_angle'].lower()}.

If useful, I can send a short 3-point pilot outline tailored to your properties this week.

Best,
{SIGNOFF_NAME}
"""

    script = f'''
tell application "Mail"
    set newMessage to make new outgoing message with properties {{subject:"{applescript_escape(subject)}", content:"{applescript_escape(body)}", visible:false}}
    tell newMessage
        make new to recipient at end of to recipients with properties {{address:"{applescript_escape(target["contact_email"])}"}}
        save
    end tell
end tell
'''

    subprocess.run(["osascript", "-e", script], check=True)


def main() -> None:
    targets = json.loads(TARGETS_PATH.read_text(encoding="utf-8"))
    for target in targets[:5]:
        create_draft(target)
        print(f"Draft created for {target['company']} -> {target['contact_email']}")


if __name__ == "__main__":
    main()
