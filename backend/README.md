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

The current implementation uses in-memory catalog seed data that matches
`docs/API_CONTRACT.md`. Supabase persistence is intentionally deferred until the
schema is confirmed.
