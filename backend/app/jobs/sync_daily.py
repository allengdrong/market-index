import os
import urllib3
from datetime import date, datetime, timedelta

import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

# config import는 로컬 개발용 (.env 로드)
# GitHub Actions에서는 환경변수가 이미 주입됨
try:
    from app import config  # noqa: F401
except Exception:
    pass

from app.db import SessionLocal
from app.models import MarketSeries

KOREAEXIM_API_URL = "https://www.koreaexim.go.kr/site/program/financial/exchangeJSON"
KOSPI_API_URL = "https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex"


def _resolve_exim_date(today: date) -> date:
    # Use last weekday (Fri) for weekend to avoid extra calls.
    if today.weekday() == 5:  # Saturday
        return today - timedelta(days=1)
    if today.weekday() == 6:  # Sunday
        return today - timedelta(days=2)
    return today


def _fetch_usdkrw_rate(search_date: date, api_key: str) -> dict | None:
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
        print(f"[sync] EXIM API error: {exc}", flush=True)
        return None

    if not data:
        return None

    for item in data:
        if item.get("cur_unit") == "USD":
            rate_str = item.get("deal_bas_r", "0").replace(",", "")
            return {
                "date": search_date,
                "value": float(rate_str),
                "source": "exim",
            }

    return None


def _fetch_kospi_latest(api_key: str) -> dict | None:
    params = {
        "serviceKey": api_key,
        "numOfRows": 10,
        "resultType": "json",
        "idxNm": "\ucf54\uc2a4\ud53c",
    }

    try:
        resp = requests.get(KOSPI_API_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"[sync] KOSPI API error: {exc}", flush=True)
        return None

    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    if not items:
        return None

    latest_item = None
    latest_date = None
    for item in items:
        bas_dt = item.get("basDt", "")
        clpr = item.get("clpr", "0")
        if not bas_dt or not clpr:
            continue
        parsed_date = datetime.strptime(bas_dt, "%Y%m%d").date()
        if latest_date is None or parsed_date > latest_date:
            latest_date = parsed_date
            latest_item = {"date": parsed_date, "value": float(clpr), "source": "data.go.kr"}

    return latest_item


def _upsert_market_series(db: Session, metric: str, series_date: date, value: float, source: str) -> None:
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


def run_sync(db: Session | None = None) -> dict:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    result = {"kospi": "skipped", "usdkrw": "skipped"}
    try:
        kospi_key = os.getenv("KOSPI_API_KEY") or os.getenv("DATA_GO_KR_API_KEY") or ""
        exim_key = os.getenv("EXIM_API_KEY") or ""

        if kospi_key:
            kospi_data = _fetch_kospi_latest(kospi_key)
            if kospi_data:
                _upsert_market_series(
                    db,
                    "kospi",
                    kospi_data["date"],
                    kospi_data["value"],
                    kospi_data["source"],
                )
                result["kospi"] = kospi_data["date"].isoformat()
            else:
                result["kospi"] = "no-data"
        else:
            result["kospi"] = "missing-api-key"

        if exim_key:
            target_date = _resolve_exim_date(date.today())
            exists_stmt = select(MarketSeries.id).where(
                MarketSeries.metric == "usdkrw", MarketSeries.date == target_date
            )
            exists = db.execute(exists_stmt).first()
            if exists:
                result["usdkrw"] = "already-present"
            else:
                usd_data = _fetch_usdkrw_rate(target_date, exim_key)
                if usd_data:
                    _upsert_market_series(
                        db,
                        "usdkrw",
                        usd_data["date"],
                        usd_data["value"],
                        usd_data["source"],
                    )
                    result["usdkrw"] = usd_data["date"].isoformat()
                else:
                    result["usdkrw"] = "no-data"
        else:
            result["usdkrw"] = "missing-api-key"

        db.commit()
        return result
    except Exception:
        db.rollback()
        raise
    finally:
        if own_session:
            db.close()


if __name__ == "__main__":
    output = run_sync()
    print(output, flush=True)
