# Market Dashboard

FastAPI + React dashboard with PostgreSQL-backed market series cache.

## Local setup

### Backend

1) Create and fill `backend/.env` (see `backend/.env.example`).
2) Install dependencies:

```
cd backend
pip install -r requirements.txt
```

3) Run migrations:

```
cd backend
alembic upgrade head
```

4) Start API server:

```
cd backend
python -m uvicorn app.main:app --reload --port 8001
```

### Frontend

```
cd frontend
npm install
npm run dev
```

## Batch sync

### Manual execution

Run the daily batch job (fetches latest KOSPI and USD/KRW and upserts into DB):

```
cd backend
python cron_sync.py
```

You can also trigger it via the admin endpoint:

```
POST /admin/sync?token=YOUR_ADMIN_SYNC_TOKEN
```

### Automated (GitHub Actions)

Daily sync runs automatically via GitHub Actions cron at 00:00 UTC (09:00 KST).

- Workflow: `.github/workflows/cron_sync.yml`
- Manual trigger: Actions → "Daily Market Data Sync" → Run workflow

## Environment variables

> **Important**: 환경변수는 GitHub Secrets 또는 Render Environment Variables로 관리합니다.
> 절대로 `.env` 파일을 Git에 커밋하지 마세요.

> **Security Note**: 이미 노출된 API 키가 있다면 즉시 재발급 받으세요.
> - 공공데이터포털: https://www.data.go.kr/
> - 한국수출입은행: https://www.koreaexim.go.kr/

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATA_GO_KR_API_KEY` | Yes | 공공데이터포털 API 키 (KOSPI) |
| `EXIM_API_KEY` | Yes | 한국수출입은행 API 키 (환율) |
| `ADMIN_SYNC_TOKEN` | No | /admin/sync 엔드포인트용 토큰 |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | Backend API URL (default: http://localhost:8001) |

### GitHub Secrets (for Actions)

Repository Settings → Secrets and variables → Actions에서 설정:

- `DATABASE_URL`: Render PostgreSQL **External Database URL**
- `DATA_GO_KR_API_KEY`
- `EXIM_API_KEY`
- `ADMIN_SYNC_TOKEN`

## Deployment

### Render

- Backend: Web Service (Python)
- Frontend: Static Site (Vite)
- Database: PostgreSQL

GitHub Actions cron이 External Database URL로 직접 데이터를 upsert합니다.
