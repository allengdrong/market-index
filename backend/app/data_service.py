from datetime import date, datetime, timedelta
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MarketSeries

MetricType = Literal["kospi", "usdkrw"]
PeriodType = Literal["1d", "1w", "1m", "custom"]

PERIOD_DAYS = {"1d": 2, "1w": 7, "1m": 30, "3m": 90, "1y": 365}


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def _get_common_dates(db: Session, query_start: date, query_end: date) -> set[date]:
    """Get dates where both kospi and usdkrw data exist."""
    kospi_stmt = (
        select(MarketSeries.date)
        .where(MarketSeries.metric == "kospi")
        .where(MarketSeries.date >= query_start)
        .where(MarketSeries.date <= query_end)
    )
    usdkrw_stmt = (
        select(MarketSeries.date)
        .where(MarketSeries.metric == "usdkrw")
        .where(MarketSeries.date >= query_start)
        .where(MarketSeries.date <= query_end)
    )

    kospi_dates = {row[0] for row in db.execute(kospi_stmt).all()}
    usdkrw_dates = {row[0] for row in db.execute(usdkrw_stmt).all()}

    return kospi_dates & usdkrw_dates


def get_series_from_db(
    db: Session,
    metric: MetricType,
    period: PeriodType,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    start = _parse_date(start_date)
    end = _parse_date(end_date)

    if start and end:
        query_start = start
        query_end = end
    else:
        days = PERIOD_DAYS.get(period, 30)
        query_end = date.today()
        query_start = query_end - timedelta(days=days - 1)

    common_dates = _get_common_dates(db, query_start, query_end)

    # Ensure at least 2 data points for line chart
    if len(common_dates) < 2:
        extended_start = query_start - timedelta(days=30)
        all_common = _get_common_dates(db, extended_start, query_end)
        sorted_dates = sorted(all_common, reverse=True)[:2]
        common_dates = set(sorted_dates)

    stmt = (
        select(MarketSeries.date, MarketSeries.value)
        .where(MarketSeries.metric == metric)
        .where(MarketSeries.date.in_(common_dates))
        .order_by(MarketSeries.date.asc())
    )

    rows = db.execute(stmt).all()
    return [{"date": row.date.isoformat(), "value": float(row.value)} for row in rows]


def calculate_stats(series: list[dict]) -> dict:
    if not series:
        return {}

    values = [item["value"] for item in series]
    min_val = min(values)
    max_val = max(values)
    avg_val = sum(values) / len(values)
    change = values[-1] - values[0]
    change_pct = (change / values[0]) * 100 if values[0] != 0 else 0

    return {
        "min": round(min_val, 2),
        "max": round(max_val, 2),
        "avg": round(avg_val, 2),
        "change": round(change, 2),
        "changePct": round(change_pct, 2),
    }
