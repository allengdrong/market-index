import logging
import os
import sys
import time
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.data_service import calculate_stats, get_series_from_db
from app.db import SessionLocal
from app.jobs.sync_daily import run_sync

# Log to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Ensure line-buffered stdout
sys.stdout.reconfigure(line_buffering=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    query = str(request.query_params) if request.query_params else ""
    print(f">> Request: {request.method} {request.url.path} {query}", flush=True)

    response = await call_next(request)

    duration = round((time.time() - start_time) * 1000, 2)
    print(f"<< Response: {response.status_code} ({duration}ms)", flush=True)

    return response


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok"}


@app.head("/health")
def health_head():
    return Response(status_code=200)


@app.get("/api/series")
def series(
    metric: str = "kospi",
    period: str = "1m",
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if metric not in {"kospi", "usdkrw"}:
        raise HTTPException(status_code=400, detail="Unsupported metric")

    if startDate and endDate:
        series_data = get_series_from_db(db, metric, "custom", startDate, endDate)
    else:
        if period not in {"1d", "1w", "1m", "3m", "1y"}:
            raise HTTPException(status_code=400, detail="Unsupported period")
        series_data = get_series_from_db(db, metric, period)

    stats = calculate_stats(series_data)

    return {
        "metric": metric,
        "period": period,
        "startDate": startDate,
        "endDate": endDate,
        "series": series_data,
        "stats": stats,
    }


@app.post("/admin/sync")
def admin_sync(token: str, db: Session = Depends(get_db)):
    expected = os.getenv("ADMIN_SYNC_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=500, detail="ADMIN_SYNC_TOKEN is not set")
    if token != expected:
        raise HTTPException(status_code=403, detail="Invalid token")

    result = run_sync(db)
    return {"status": "ok", "result": result}
