# Orchestration Plan

## Mode Selection

- Repo: /Users/stephenbrown/Code/OPENSOURCE/aidme-app
- Branch: dev
- Work mode: full
- Run folder: /Users/stephenbrown/Code/OPENSOURCE/aidme-app/agent-runs/2026-06-20-codebase-pass
- Verifiable gates: `npm run lint`, `npm run test:ci`, `npm run build`, `git diff --check`, Git remote read, dry-run push, final branch sync.
- Human-decision blockers: product roadmap changes, auth/backend additions, force push/main push, manual Web Speech browser QA, legal copy date changes.
- Resume policy: resume from `run-state.md`, `task-queue.md`, latest phase report, and Git state; push any validated local phase commit before new edits.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop, Quality Gate Selection Loop | Lint, tests, build, and dependency diagnostics are recorded | Clean baseline or failures classified with owners |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop | Highest-priority verifiable tasks pass targeted checks and lint | Fix batch pushed or blocked with evidence |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Safe package/dead-code changes pass lint/tests/build | Safe cleanup pushed or deferred with evidence |
| Review | Judge Loop | PASS or bounded follow-up tasks | Review report pushed |
| Stabilization Loop | Stabilization Loop, Judge Loop | Completion criteria pass | Stabilization report pushed or blocker recorded |
| Integrator | Final Completion Gate | Final remote/read dry-run push, clean tree, synced branch | Final report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `agent-runs/2026-06-20-codebase-pass/*`, `AGENTS.md`, `spec.md` | Startup planning, resume state, and current-state docs |
| T-002 | `agent-runs/2026-06-20-codebase-pass/02-baseline-validation.md`, `package.json`, project configs | Baseline verification only unless failures are classified later |
| T-003 | `agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md`, `task-queue.md` | Evidence-backed backlog and scorecard |
| T-004 | `src/components/Header.tsx`, related tests if practical, execution report | Restore native WebView logo refresh contract while preserving web About navigation |
| T-005 | `package.json`, `package-lock.json`, source files proven unused | Safe package/dead-code cleanup only with verification |
| T-006 | review/stabilization/final reports | Judge, stabilization, and final completion records |
