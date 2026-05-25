# /verify — Run full verification suite

Run the full ChefWare verification pipeline and report results.

```bash
echo "=== Backend ===" && cd backend && pytest -x -q
echo "=== Frontend ===" && cd ../frontend && npm run build && npm run lint
echo "=== Done ==="
```

If any step fails:
1. Report exactly which command failed and the error output
2. Do NOT proceed to the next task until fixed
3. Propose a fix and ask for approval before applying it
