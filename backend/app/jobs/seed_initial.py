"""One-time script to seed initial 1-month data for KOSPI and USD/KRW."""

import os
import urllib3
from datetime import date, timedelta

import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert

from app import config  # noqa: F401
from app.db import SessionLocal
from app.models import MarketSeries

KOREAEXIM_API_URL = "https://www.koreaexim.go.kr/site/program/financial/exchangeJSON"
KOSPI_API_URL = "https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex"


def _upsert_market_series(db, metric: str, series_date: date, value: float, source: str) -> None:
    stmt = insert(MarketSeries).values(
        metric=metric,
        date=series_date,
        value=value,
        source=source,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=[MarketSeries.metric, MarketSeries.date],
        set_={
            "value": value,
            "source": source,
            "updated_at": func.now(),
        },
    )
    db.execute(stmt)


def fetch_kospi_history(api_key: str, start_date: date, end_date: date) -> list[dict]:
    """Fetch KOSPI historical data."""
    params = {
        "serviceKey": api_key,
        "numOfRows": 500,
        "resultType": "json",
        "idxNm": "코스피",
        "beginBasDt": start_date.strftime("%Y%m%d"),
        "endBasDt": end_date.strftime("%Y%m%d"),
    }

    try:
        resp = requests.get(KOSPI_API_URL, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"[seed] KOSPI API error: {exc}")
        return []

    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    results = []
    for item in items:
        bas_dt = item.get("basDt", "")
        clpr = item.get("clpr", "0")
        if bas_dt and clpr:
            from datetime import datetime
            parsed_date = datetime.strptime(bas_dt, "%Y%m%d").date()
            results.append({"date": parsed_date, "value": float(clpr), "source": "data.go.kr"})

    return results


def fetch_usdkrw_for_date(api_key: str, search_date: date) -> dict | None:
    """Fetch USD/KRW rate for a specific date."""
    # Skip weekends
    if search_date.weekday() >= 5:
        return None

    params = {
        "authkey": api_key,
        "searchdate": search_date.strftime("%Y%m%d"),
        "data": "AP01",
    }

    try:
        resp = requests.get(KOREAEXIM_API_URL, params=params, timeout=10, verify=False)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"[seed] EXIM API error for {search_date}: {exc}")
        return None

    if not data:
        return None

    for item in data:
        if item.get("cur_unit") == "USD":
            rate_str = item.get("deal_bas_r", "0").replace(",", "")
            return {"date": search_date, "value": float(rate_str), "source": "exim"}

    return None


def seed_data(start_date: date, end_date: date | None = None) -> dict:
    """Seed initial data for both metrics."""
    db = SessionLocal()
    result = {"kospi": 0, "usdkrw": 0}

    if end_date is None:
        end_date = date.today()

    try:
        kospi_key = os.getenv("KOSPI_API_KEY") or os.getenv("DATA_GO_KR_API_KEY") or ""
        exim_key = os.getenv("EXIM_API_KEY") or ""

        # Seed KOSPI
        if kospi_key:
            print(f"[seed] Fetching KOSPI data from {start_date} to {end_date}...")
            kospi_data = fetch_kospi_history(kospi_key, start_date, end_date)
            for item in kospi_data:
                _upsert_market_series(db, "kospi", item["date"], item["value"], item["source"])
                result["kospi"] += 1
            print(f"[seed] KOSPI: {result['kospi']} records")
        else:
            print("[seed] KOSPI_API_KEY not set, skipping KOSPI")

        # Seed USD/KRW
        if exim_key:
            print(f"[seed] Fetching USD/KRW data from {start_date} to {end_date}...")
            current = end_date
            while current >= start_date:
                usd_data = fetch_usdkrw_for_date(exim_key, current)
                if usd_data:
                    _upsert_market_series(db, "usdkrw", usd_data["date"], usd_data["value"], usd_data["source"])
                    result["usdkrw"] += 1
                    print(f"  {current}: {usd_data['value']}")
                current -= timedelta(days=1)
        else:
            print("[seed] EXIM_API_KEY not set, skipping USD/KRW")

        db.commit()
        print(f"[seed] Done! KOSPI: {result['kospi']}, USD/KRW: {result['usdkrw']}")
        return result

    except Exception as e:
        db.rollback()
        print(f"[seed] Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data(date(2025, 1, 1))
