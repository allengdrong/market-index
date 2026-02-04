"""
Cron job script for daily market data sync.

- GitHub Actions 또는 로컬에서 실행
- 환경변수에서 설정 로드 (dotenv 미사용)
- Postgres advisory lock으로 중복 실행 방지
"""

import os
import sys
import time
from datetime import datetime

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 환경변수 검증
REQUIRED_ENV = ["DATABASE_URL", "DATA_GO_KR_API_KEY", "EXIM_API_KEY"]

def check_env():
    """필수 환경변수 확인"""
    missing = [key for key in REQUIRED_ENV if not os.environ.get(key)]
    if missing:
        print(f"[cron] ERROR: Missing environment variables: {', '.join(missing)}", flush=True)
        sys.exit(1)


def acquire_advisory_lock(engine, lock_id: int = 12345) -> bool:
    """
    Postgres advisory lock 획득 시도.
    다른 프로세스가 이미 실행 중이면 False 반환.
    """
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT pg_try_advisory_lock({lock_id})"))
        locked = result.scalar()
        conn.commit()
        return locked


def release_advisory_lock(engine, lock_id: int = 12345):
    """Advisory lock 해제"""
    with engine.connect() as conn:
        conn.execute(text(f"SELECT pg_advisory_unlock({lock_id})"))
        conn.commit()


def main():
    start_time = datetime.now()
    print(f"[cron] ========================================", flush=True)
    print(f"[cron] Starting daily sync at {start_time.isoformat()}", flush=True)
    print(f"[cron] ========================================", flush=True)

    # 환경변수 확인
    check_env()

    # DB 연결
    database_url = os.environ["DATABASE_URL"]
    engine = create_engine(database_url)

    # Advisory lock 획득 시도
    if not acquire_advisory_lock(engine):
        print("[cron] WARNING: Another sync process is running. Exiting.", flush=True)
        sys.exit(0)  # 중복 실행은 에러가 아님

    try:
        # sync 로직 import (DB 연결 후)
        from app.jobs.sync_daily import run_sync

        result = run_sync()

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"[cron] ========================================", flush=True)
        print(f"[cron] Sync completed at {end_time.isoformat()}", flush=True)
        print(f"[cron] Duration: {duration:.2f} seconds", flush=True)
        print(f"[cron] Results:", flush=True)
        print(f"[cron]   - KOSPI: {result.get('kospi', 'N/A')}", flush=True)
        print(f"[cron]   - USD/KRW: {result.get('usdkrw', 'N/A')}", flush=True)
        print(f"[cron] ========================================", flush=True)

    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"[cron] ========================================", flush=True)
        print(f"[cron] ERROR: Sync failed after {duration:.2f} seconds", flush=True)
        print(f"[cron] Exception: {e}", flush=True)
        print(f"[cron] ========================================", flush=True)
        sys.exit(1)

    finally:
        release_advisory_lock(engine)
        engine.dispose()


if __name__ == "__main__":
    main()
