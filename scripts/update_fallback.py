"""
Backend API에서 데이터를 가져와 frontend/public/fallback-data.json을 업데이트합니다.

사용법:
  python scripts/update_fallback.py [API_URL]

예시:
  python scripts/update_fallback.py https://market-index-backend.onrender.com
"""

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_URL = sys.argv[1] if len(sys.argv) > 1 else "https://market-index-backend.onrender.com"
OUTPUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fallback-data.json"

METRICS = ["kospi", "usdkrw"]
PERIODS = ["1d", "1w", "1m", "3m", "1y"]


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "fallback-updater"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    print(f"API: {API_URL}")
    print(f"Output: {OUTPUT}\n")

    # 서버 health check
    try:
        health = fetch_json(f"{API_URL}/health")
        print(f"Health: {health.get('status', 'unknown')}\n")
    except Exception as e:
        print(f"서버에 연결할 수 없습니다: {e}")
        sys.exit(1)

    result = {}
    success = 0
    fail = 0

    for metric in METRICS:
        result[metric] = {}
        for period in PERIODS:
            url = f"{API_URL}/api/series?metric={metric}&period={period}"
            try:
                data = fetch_json(url)
                count = len(data.get("series", []))
                result[metric][period] = data
                print(f"  OK  {metric}/{period}: {count}건")
                success += 1
            except Exception as e:
                print(f"  FAIL {metric}/{period}: {e}")
                result[metric][period] = {
                    "metric": metric,
                    "period": period,
                    "startDate": None,
                    "endDate": None,
                    "series": [],
                    "stats": None,
                }
                fail += 1

    result["updatedAt"] = datetime.now(timezone.utc).isoformat()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n완료: {success}건 성공, {fail}건 실패")
    print(f"저장: {OUTPUT}")


if __name__ == "__main__":
    main()
