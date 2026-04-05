import csv
from collections import defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[1]
pipeline_path = root / "docs" / "ops" / "revenue_pipeline.csv"

rows = list(csv.DictReader(pipeline_path.open(encoding="utf-8")))
total_low = sum(float(r["expected_low_usd"] or 0) for r in rows)
total_high = sum(float(r["expected_high_usd"] or 0) for r in rows)

by_lane = defaultdict(lambda: [0.0, 0.0, 0])
for row in rows:
    lane = row["lane"]
    by_lane[lane][0] += float(row["expected_low_usd"] or 0)
    by_lane[lane][1] += float(row["expected_high_usd"] or 0)
    by_lane[lane][2] += 1

print(f"Pipeline file: {pipeline_path}")
print(f"Total pipeline low:  USD {total_low:,.2f}")
print(f"Total pipeline high: USD {total_high:,.2f}")
print("")
for lane in sorted(by_lane):
    low, high, count = by_lane[lane]
    print(f"- {lane}: {count} items | USD {low:,.2f} to USD {high:,.2f}")
