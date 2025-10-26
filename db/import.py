import json
import argparse
import pymysql
from pathlib import Path

# ----------------- CLI -----------------
ap = argparse.ArgumentParser(description="Import HKPO mobile office JSON into MySQL")
ap.add_argument("--file", "-f", default="mobile-office.json", help="Path to JSON file")
ap.add_argument("--host", default="localhost")
ap.add_argument("--user", default="root")
ap.add_argument("--password", default="")  # <-- adjust
ap.add_argument("--database", default="hkpo_mobile")
ap.add_argument("--dry-run", action="store_true", help="Parse and validate only; no DB writes")
args = ap.parse_args()

# ----------------- Helpers -----------------
def norm_time(t):
    if not t:
        return None
    t = str(t).strip().replace(".", ":")
    parts = t.split(":")
    if len(parts) != 2:
        return None
    try:
        h, m = int(parts[0]), int(parts[1])
        if 0 <= h <= 23 and 0 <= m <= 59:
            return f"{h:02d}:{m:02d}"
    except ValueError:
        return None
    return None

# ----------------- Load JSON -----------------
p = Path(args.file)
if not p.exists():
    print(json.dumps({"success": False, "message": f"JSON file not found: {p}"}))
    raise SystemExit(1)

raw = p.read_text(encoding="utf-8")
raw = raw.lstrip("\ufeff")  # strip BOM if present
data = json.loads(raw)

rows = data["data"] if isinstance(data, dict) and isinstance(data.get("data"), list) else (
       data if isinstance(data, list) else [])
last_update = data.get("lastUpdateDate") if isinstance(data, dict) else None

if not rows:
    print(json.dumps({"success": False, "message": "No records to import"}))
    raise SystemExit(1)

# ----------------- DB connect -----------------
conn = pymysql.connect(
    host=args.host, user=args.user, password=args.password,
    database=args.database, charset="utf8mb4"
)
cur = conn.cursor()

sql = """
INSERT INTO mobilepost (
  mobileCode, locationTC, locationSC, addressTC,
  nameSC, districtSC, addressSC, closeHour,
  nameTC, districtTC, latitude, openHour, dayOfWeekCode,
  nameEN, districtEN, locationEN, addressEN, seq, longitude
) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
ON DUPLICATE KEY UPDATE
  locationTC = VALUES(locationTC),
  locationSC = VALUES(locationSC),
  addressTC  = VALUES(addressTC),
  nameSC     = VALUES(nameSC),
  districtSC = VALUES(districtSC),
  addressSC  = VALUES(addressSC),
  closeHour  = VALUES(closeHour),
  nameTC     = VALUES(nameTC),
  districtTC = VALUES(districtTC),
  latitude   = VALUES(latitude),
  openHour   = VALUES(openHour),
  nameEN     = VALUES(nameEN),
  districtEN = VALUES(districtEN),
  locationEN = VALUES(locationEN),
  addressEN  = VALUES(addressEN),
  longitude  = VALUES(longitude)
"""

stats = {
    "read": 0, "inserted": 0, "updated": 0, "unchanged": 0,
    "skipped": 0, "errors": 0, "lastUpdateDate": last_update
}
err_samples = []

# Only start a transaction if not a dry-run
if not args.dry_run:
    conn.begin()

for idx, r in enumerate(rows):
    stats["read"] += 1

    # Unique key required for idempotent upsert
    mobileCode = r.get("mobileCode")
    dayOfWeekCode = r.get("dayOfWeekCode")
    seq = r.get("seq")
    if not mobileCode or dayOfWeekCode is None or seq is None:
        stats["skipped"] += 1
        continue

    # Optional fields
    payload = (
        str(mobileCode),
        str(r.get("locationTC", "") or ""),
        str(r.get("locationSC", "") or ""),
        str(r.get("addressTC", "") or ""),
        str(r.get("nameSC", "") or ""),
        str(r.get("districtSC", "") or ""),
        str(r.get("addressSC", "") or ""),
        norm_time(r.get("closeHour")),
        str(r.get("nameTC", "") or ""),
        str(r.get("districtTC", "") or ""),
        float(r["latitude"])  if (r.get("latitude")  not in (None, "")) else None,
        norm_time(r.get("openHour")),
        int(dayOfWeekCode),
        str(r.get("nameEN", "") or ""),
        str(r.get("districtEN", "") or ""),
        str(r.get("locationEN", "") or ""),
        str(r.get("addressEN", "") or ""),
        int(seq),
        float(r["longitude"]) if (r.get("longitude") not in (None, "")) else None,
    )

    if args.dry_run:
        continue

    try:
        cur.execute(sql, payload)
        # MySQL semantics: 1=inserted, 2=updated, 0=no-op (unchanged)
        aff = cur.rowcount
        if aff == 1:   stats["inserted"] += 1
        elif aff == 2: stats["updated"]  += 1
        else:          stats["unchanged"] += 1
    except Exception as e:
        stats["errors"] += 1
        if len(err_samples) < 5:  # sample a few errors for visibility
            err_samples.append({"index": idx, "key": [mobileCode, dayOfWeekCode, seq], "error": str(e)})

if not args.dry_run:
    conn.commit()
cur.close()
conn.close()

print(json.dumps({"success": True, "summary": stats, "sampleErrors": err_samples},
                 ensure_ascii=False))