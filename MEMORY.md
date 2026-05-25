Maintain this file. After any significant decision, about direction, format, content, approach, or strategy, add an entry:

## [Date], [Decision]
**What was decided:** [the choice made]
**Why:** [the reasoning]
**What was rejected:** [alternatives considered and why they were ruled out]

Read MEMORY.md at the start of every session before doing anything. Never contradict a logged decision without flagging it first.

---

## 2026-05-25, Codex project reference
**What was decided:** Add `AGENTS.md` as the Codex entry point and keep `CLAUDE.md` as the canonical project contract.
**Why:** The project was already set up for Claude, and Codex needs a stable local reference that points to the same client rules without creating competing instructions.
**What was rejected:** Duplicating all Claude instructions into a separate Codex-only file, because duplicated rules would drift and create ambiguity.
