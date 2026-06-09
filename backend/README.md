# ChefWare Backend

FastAPI backend for the ChefWare Enterprise e-commerce platform.

## Local Setup

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Verification

```bash
cd backend
python -m pytest -x -q
```

The app uses Supabase repositories when credentials are configured and local
in-memory repositories for tests/development when credentials are blank. Manual
migrations live in `backend/migrations/` and must be applied explicitly.
