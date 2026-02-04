# Market Dashboard

FastAPI + React dashboard with PostgreSQL-backed market series cache.

## Local setup

### Backend

1) Create and fill `backend/.env` (see `.env.example`).
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

Run the daily batch job (fetches latest KOSPI and USD/KRW and upserts into DB):

```
cd backend
python -m app.jobs.sync_daily
```

You can also trigger it via the admin endpoint:

```
POST /admin/sync?token=YOUR_ADMIN_SYNC_TOKEN
```

## Environment variables

Backend:
- `DATABASE_URL` (required)
- `ADMIN_SYNC_TOKEN` (required for /admin/sync)
- `KOSPI_API_KEY` or `DATA_GO_KR_API_KEY`
- `EXIM_API_KEY`

Frontend:
- `VITE_API_BASE_URL` (default: http://localhost:8001)
