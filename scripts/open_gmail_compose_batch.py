import json
import subprocess
from pathlib import Path
from urllib.parse import urlencode, quote

ROOT = Path(__file__).resolve().parents[1]
TARGETS_PATH = ROOT / "docs" / "ops" / "hotel_target_list_2026-03-31.json"
SIGNOFF_NAME = "Rumed Sodimana"


def compose_url(target: dict) -> str:
    subject = f"{target['company']}: quick idea to recover missed reservations and upsells"
    body = f"""Hi {target['company']} team,

{target['personalization']}

I build hotel-specific AI pilots that help properties capture reservation demand after hours, answer repeat guest questions faster, route service requests into operations, and surface paid upsells like early check-in, room upgrades, late checkout, breakfast, parking, and spa add-ons.

I already have a hotel operations stack running with concierge logic, guest request routing, payments, and property workflows. I am offering a fixed-scope 14-day pilot for groups that want a faster path to direct revenue and reduced front desk load without a long implementation cycle.

For {target['company']}, I would position this as a {target['pitch_angle'].lower()}.

If useful, I can send a short 3-point pilot outline tailored to your properties this week.

Best,
{SIGNOFF_NAME}"""

    params = urlencode(
        {
            "view": "cm",
            "fs": "1",
            "tf": "1",
            "to": target["contact_email"],
            "su": subject,
            "body": body,
        },
        quote_via=quote,
    )
    return f"https://mail.google.com/mail/u/0/?{params}"


def main() -> None:
    targets = json.loads(TARGETS_PATH.read_text(encoding="utf-8"))
    for target in targets[:5]:
        url = compose_url(target)
        script = f'''
tell application "Google Chrome"
    activate
    if (count of windows) = 0 then make new window
    tell front window
        make new tab with properties {{URL:"{url}"}}
        set active tab index to (count of tabs)
    end tell
end tell
delay 4
'''
        subprocess.run(["osascript", "-e", script], check=True)
        print(f"Opened Gmail compose for {target['company']} -> {target['contact_email']}")


if __name__ == "__main__":
    main()
