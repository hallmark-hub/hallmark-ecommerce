# /new-endpoint — Scaffold a new FastAPI endpoint

Before writing any code:
1. State the endpoint's purpose in one sentence
2. List the Pydantic request and response models needed
3. Identify which Supabase table(s) are involved
4. Note any new environment variables required (prefix comment with `# ENV:`)
5. Get approval from Evans before proceeding

Then scaffold:
- `backend/app/routers/<domain>.py` — route handler
- `backend/app/services/<domain>_service.py` — business logic
- `backend/app/models/<domain>.py` — Pydantic schemas
- `backend/tests/test_<domain>.py` — at least one happy path test

Follow the response format: `{ "success": bool, "data": ..., "message": str }`
