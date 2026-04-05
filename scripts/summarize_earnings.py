import csv
from collections import defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ledger_path = root / "docs" / "ops" / "earnings_ledger.csv"

rows = []
with ledger_path.open(newline="", encoding="utf-8") as handle:
    reader = csv.DictReader(handle)
    rows = list(reader)

total_amount = 0.0
total_received = 0.0
by_lane_amount = defaultdict(float)
by_lane_received = defaultdict(float)

for row in rows:
    amount = float(row["amount"] or 0)
    received = float(row["received_amount"] or 0)
    total_amount += amount
    total_received += received
    by_lane_amount[row["lane"]] += amount
    by_lane_received[row["lane"]] += received

print(f"Ledger: {ledger_path}")
print(f"Total contracted: USD {total_amount:,.2f}")
print(f"Total received:   USD {total_received:,.2f}")
print("")
print("By lane:")
for lane in sorted(by_lane_amount):
    print(
        f"- {lane}: contracted USD {by_lane_amount[lane]:,.2f}, "
        f"received USD {by_lane_received[lane]:,.2f}"
    )

print("")
print("Recent entries:")
for row in rows[-10:]:
    print(
        f"- {row['date']} | {row['lane']} | {row['status']} | "
        f"{row['client_or_platform']} | USD {float(row['amount'] or 0):,.2f} | "
        f"received USD {float(row['received_amount'] or 0):,.2f}"
    )
