# AGENTS.md - Codex Project Reference

This file is the Codex entry point for the ChefWare Enterprise e-commerce
project. Treat `CLAUDE.md` as the canonical project contract and read
`MEMORY.md` before starting any task.

## Startup Checklist

1. Read `MEMORY.md` first.
2. Read `CLAUDE.md` for the active client rules, stack, domain constraints, and
   verification expectations.
3. Check `git status --short` before editing so existing user/client changes are
   not overwritten.
4. State assumptions before non-trivial work and keep changes surgical.

## Operating Rules

- Follow the behavioral guidelines, scope control, hard stops, tech stack, code
  standards, and domain rules in `CLAUDE.md`.
- Do not contradict a logged memory decision without flagging it first.
- Do not deploy, push, run migrations, contact real users, or perform external
  side effects without explicit in-session confirmation.
- Do not delete files, remove dependencies, or perform destructive actions
  without explicit approval.
- Keep implementation diffs small and directly tied to the current task.
- Prefer the repo's existing patterns over new abstractions.

## Codex Verification

Use the repo-provided verification commands when the relevant project folders
exist:

```bash
make verify
```

or, by area:

```bash
cd backend && pytest -x -q
cd frontend && npm run build && npm run lint
```

If a command cannot run because the corresponding project area has not been
created yet, report that clearly instead of treating it as a code failure.

## Task Closeout

After each coding task, include the status report required by `CLAUDE.md`:

- **Files changed:** list every file touched
- **What was modified:** one line per file
- **Files intentionally not touched:** if relevant
- **Follow-up needed:** anything requiring attention

## Claude Setup Reference

The existing Claude-specific files remain in place:

- `CLAUDE.md` - canonical project instructions
- `.claude/settings.json` - Claude permission hints
- `.claude/commands/verify.md` - verification workflow
- `.claude/commands/new-endpoint.md` - endpoint scaffolding workflow
- `.claude/commit-pr.md` - commit and PR workflow

Codex should reference these files rather than duplicating their content.
