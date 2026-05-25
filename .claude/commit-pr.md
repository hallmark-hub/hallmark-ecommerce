# /commit-pr — Stage, commit, push and open a PR

```bash
git status
git diff --stat
```

Review the above, then:
1. Write a conventional commit message: `feat|fix|chore|docs: <short description>`
2. Confirm the message with Evans before committing
3. Run: `git add -A && git commit -m "<message>" && git push`
4. If on a feature branch, create a PR to `main` with:
   - Title: same as commit message
   - Body: bullet list of what changed and why
   - Label: `ready-for-review`

Do NOT push directly to `main`. Always use feature branches.
