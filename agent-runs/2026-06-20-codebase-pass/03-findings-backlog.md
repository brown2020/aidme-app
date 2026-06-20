# Agent Report

## Agent

Name: Codex

## Scope

Inspected route structure, core client hooks, store persistence, speech-recognition singleton ownership, permission lifecycle, tests, dependency diagnostics, and docs drift. No source files were edited in this phase.

## Inputs

`02-baseline-validation.md`, `AGENTS.md`, `spec.md`, `src/components/Header.tsx`, `src/hooks/useListening.ts`, `src/hooks/useMicrophonePermission.ts`, `src/lib/speechRecognition.ts`, `src/lib/route-security.test.ts`, `src/types/speech.d.ts`, `package.json`, `npm outdated`, `npm audit --audit-level=moderate`, route/build output, and source search.

## Branch and Push

- Branch: dev
- Upstream: origin/dev
- Commit: Pending findings checkpoint
- Pushed to: Pending findings checkpoint
- Sync status: `dev` matched `origin/dev` at `89bcdf5` before findings report edits.

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: Produce an evidence-backed, prioritized backlog with owners and verification.
- Verify gate: Every finding has severity, evidence, risk, owner files, proposed fix, and verification method.
- Stop condition: Backlog is prioritized and highest-priority executable tasks are clear.
- Attempt: 1/1
- Result: Passed; fix phase should address confirmed lifecycle/contract/test issues before package cleanup.

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: 89bcdf5
- Next action: Commit/push findings backlog, then execute the small P2 fix batch.
- Blockers: None.

## Commands Run

```text
sed -n '1,260p' src/lib/speechRecognition.test.ts
sed -n '1,260p' src/lib/route-security.test.ts
sed -n '1,220p' src/hooks/useSpeechRecognitionSupported.ts
sed -n '1,220p' src/hooks/useMicToggleShortcut.ts
sed -n '1,220p' src/lib/keyboard.ts
rg -n "TODO|FIXME|eslint-disable|any\\b|setTimeout|addEventListener|removeEventListener|useEffect|window\\.|navigator\\.|localStorage|sessionStorage" src
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P2 | Bug | Open | Native wrapper | Logo click no longer sends the documented native WebView refresh message when embedded. | `spec.md` and `AGENTS.md` say logo tap posts `"refresh"`; `src/types/speech.d.ts` declares `ReactNativeWebView`; `src/components/Header.tsx` routes logo to `/about`; `rg ReactNativeWebView src` finds no source use. | iOS wrapper users may lose refresh affordance; product contract drift. | Small | Lint/build; source inspection; preserve non-WebView About navigation. | Restore conditional `window.ReactNativeWebView.postMessage("refresh")` in `Header`. |
| F-002 | P2 | Race condition | Open | Speech recognition lifecycle | Stale `onend` from a previous recognition effect can restart an old recognition instance after a language change or effect replacement. | `useListening` cleanup sets `isMountedRef.current = false`, but the next effect sets it true; old `recognition.onend` closure still calls shared `canRestartListening()` and can call `startRecognition(recognition)` for the old instance. | Duplicate/dead recognition sessions or wrong language after switching languages while listening. | Small | Add per-effect/session guard; lint/build. | Add effect-run id guard to `useListening` restart path. |
| F-003 | P2 | Race condition | Open | Permission lifecycle | Permissions API listener can be attached after unmount because the async `navigator.permissions.query()` result is not canceled. | `useMicrophonePermission` sets `removeChangeListener` inside `.then(...)`; cleanup may run before `.then`, leaving a listener and possible state updates after unmount. | Minor leak and stale state update risk in header/listen remounts. | Small | Add cancellation flag; lint/build. | Guard async permission query and remove listener on cleanup. |
| F-004 | P2 | Test gap | Open | Route model tests | Route-security test hard-codes a route array and asserts it contains itself; it also omits the shipped `/settings` route. | `src/lib/route-security.test.ts` defines `const publicRoutes = ["/", "/about", "/privacy", "/terms"]` then uses `arrayContaining` on the same values; build output includes `/settings`. | False confidence around public route inventory. | Small | Update test to assert actual route files exist, include `/settings`, and keep no API/middleware checks. | Improve route model test in fix phase. |
| F-005 | P2 | Package update | Open | Dependencies | Audit reports 4 moderate/high advisories, with safe and risky paths mixed. | `npm audit --audit-level=moderate` reports `undici`, `vite`, and `next`-bundled `postcss`; `npm audit fix` available for `undici`/`vite`, forced breaking path for `next`/`postcss`. | Known vulnerability surface in dependency tree. | Medium | Run non-force `npm audit fix` or safe updates; lint/test/build; defer forced breaking path if still present. | Package cleanup phase. |
| F-006 | P3 | Package update | Open | Dependency drift | Patch/minor updates are available across framework/dev packages; majors exist for `@types/node`, `jsdom`, `sharp`. | `npm outdated` output from baseline. | Maintenance drift; majors may be risky. | Medium | Apply patch/minor updates only; lint/test/build. | Package cleanup phase. |
| F-007 | P3 | Documentation | Deferred | README | README version badges/tables lag behind `package.json`/lockfile. | README lists older Next/React/TypeScript/Tailwind/ESLint versions; `AGENTS.md` already warns README may lag and `package.json` is authoritative. | Human onboarding confusion, but not runtime risk. | Small | Docs-only update if selected. | Defer unless docs cleanup is requested after code fixes. |

## Changes Made

- Updated findings backlog report, task queue, and run state only.

## Verification

Findings are grounded in file reads, search output, baseline command output, and build route output. No source behavior changed in this phase.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | Server route files import page components; client hooks stay within client components sampled. No API/middleware/proxy present. | None |
| Module cohesion | Watch | `Header` owns navigation, timeout, viewport setup, shortcut setup, and mic control. This is acceptable now but makes native logo behavior easy to regress. | Keep fix small; no broad split this pass |
| Public surface area | Fail | `src/types/speech.d.ts` exposes a native bridge contract that source does not currently use. | F-001 |
| Data and side-effect flow | Pass | Store distinguishes persisted preferences from ephemeral listen/permission state. | None |
| Async/cache/resource lifecycle | Fail | `useListening` restart path can be reached by stale closures; `useMicrophonePermission` async listener setup lacks cancellation. | F-002, F-003 |
| Duplication and dead code | Watch | Native bridge type appears unused because implementation regressed; route test has low-value hard-coded assertion. | F-001, F-004 |
| Dependency lean-ness | Watch | Outdated/audit diagnostics show safe update candidates and risky forced paths. | F-005, F-006 |
| Testability | Watch | Library tests pass; route model test should assert actual files; no component test harness for Header behavior. | F-004; verify Header via lint/build and source inspection |

## Quality Gate

- Command: `npm run lint` (selected before push)
- Result: Pending
- Notes: Findings phase is report-only; lint remains the required gate before push.

## Commit-Push Checkpoint

- Status inspected: Pending.
- Diff checked: Pending.
- Files staged: Pending.
- Dry-run push: Pending.
- Push: Pending.
- Post-push sync: Pending.

## Stabilization

- Cycle: Not started
- Completion criteria status: Not applicable in findings
- Remaining blockers: None

## Risks

- Native WebView behavior cannot be fully exercised in headless CI; source-level bridge restoration plus build/lint is the local verification path.
- Forced dependency fixes are explicitly out of scope unless a safe verified path appears.

## Open Questions

- None.

## Recommended Next Step

Commit/push the backlog, then fix F-001 through F-004 as a small code/test batch before package cleanup.
