import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "docs" / "ops" / "earnings_ledger.csv"


def main(argv: list[str]) -> int:
    if len(argv) != 9:
        print(
            "Usage: python3 scripts/add_earnings_entry.py "
            "<date> <lane> <status> <client_or_platform> "
            "<description> <currency> <amount> <received_amount> <notes>"
        )
        return 1

    row = argv
    with LEDGER.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(row)

    print(f"Added entry to {LEDGER}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
