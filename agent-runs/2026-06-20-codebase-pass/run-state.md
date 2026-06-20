# Run State

## Target

- Repo: /Users/stephenbrown/Code/OPENSOURCE/aidme-app
- Branch: dev
- Mode: full
- Run folder: /Users/stephenbrown/Code/OPENSOURCE/aidme-app/agent-runs/2026-06-20-codebase-pass
- Created: 2026-06-20T12:16:45-07:00
- Upstream: origin/dev

## Current State

- Phase: Findings Backlog
- Task: T-003
- Status: Ready for findings commit-push checkpoint
- Last command: rg -n "TODO|FIXME|eslint-disable|any\\b|setTimeout|addEventListener|removeEventListener|useEffect|window\\.|navigator\\.|localStorage|sessionStorage" src
- Last result: Findings F-001 through F-007 recorded; P2 fix batch identified.
- Last pushed commit: 89bcdf5
- Branch sync: `dev...origin/dev` at `89bcdf5` before findings report edits.
- Working tree: Dirty with safe in-scope findings report updates only.
- Next action: Run lint, stage findings report/state/queue changes, commit `chore: add codebase findings backlog`, dry-run push, push, fetch, and confirm sync.

## Dirty File Classification

| Path | Classification | Owner/Reason |
| --- | --- | --- |
| `agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md` | Safe-to-commit | Findings backlog for this `$sb-cbi` run |
| `agent-runs/2026-06-20-codebase-pass/run-state.md` | Safe-to-commit | Resume ledger update for findings phase |
| `agent-runs/2026-06-20-codebase-pass/task-queue.md` | Safe-to-commit | Task status/evidence update for findings phase |

## Blockers

- None.

## Deferred Items

- None.

## Commands Recorded

```text
git status --short --branch
git rev-parse --show-toplevel
git remote -v
git remote get-url origin
git ls-remote --exit-code origin HEAD
git fetch origin
git pull --ff-only origin dev
git push --dry-run origin dev
python3 /Users/stephenbrown/.agents/skills/codebase-improvement/scripts/start_run.py --root /Users/stephenbrown/Code/OPENSOURCE/aidme-app --branch dev --mode full
python3 /Users/stephenbrown/.agents/skills/codebase-improvement/scripts/validate_skill.py --skill-dir /Users/stephenbrown/.agents/skills/codebase-improvement --run-dir /Users/stephenbrown/Code/OPENSOURCE/aidme-app/agent-runs/2026-06-20-codebase-pass
npm run lint
git diff --check
npm run test:ci
npm run build
npm outdated
npm audit --audit-level=moderate
sed -n '1,260p' src/lib/speechRecognition.test.ts
sed -n '1,260p' src/lib/route-security.test.ts
sed -n '1,220p' src/hooks/useSpeechRecognitionSupported.ts
sed -n '1,220p' src/hooks/useMicToggleShortcut.ts
sed -n '1,220p' src/lib/keyboard.ts
rg -n "TODO|FIXME|eslint-disable|any\\b|setTimeout|addEventListener|removeEventListener|useEffect|window\\.|navigator\\.|localStorage|sessionStorage" src
```
