.PHONY: verify backend frontend install

verify:
	@echo "▶ Running backend tests..."
	@cd backend && python -m pytest -x -q
	@echo "▶ Running frontend build + lint..."
	@cd frontend && npm run build && npm run lint
	@echo "✅ All checks passed."

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
