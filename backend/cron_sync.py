"""Cron job script for daily market data sync."""

import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import config  # noqa: F401 - loads .env
from app.jobs.sync_daily import run_sync

if __name__ == "__main__":
    print("[cron] Starting daily sync...", flush=True)
    try:
        result = run_sync()
        print(f"[cron] Sync completed: {result}", flush=True)
    except Exception as e:
        print(f"[cron] Sync failed: {e}", flush=True)
        sys.exit(1)
