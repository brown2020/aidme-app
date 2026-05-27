# AGENTS.md — Aid.me

Single source of truth for autonomous agents (Codex, Cursor, etc.) working in this repository.

## Project overview

**Aid.me** (`aidme-app`) is a client-only Next.js web app that provides real-time speech transcription for accessibility—live closed captioning for conversations using the browser **Web Speech API**. There is no backend, database, authentication, or API layer.

A companion **iOS native app** ([Aid Hearing on the App Store](https://apps.apple.com/us/app/aid-me-hearing/id6473455500)) wraps this web experience; the web app exposes a minimal `ReactNativeWebView` bridge for refresh.

## Product purpose

Help people who are deaf or hard of hearing (and anyone who needs captions) follow nearby speech by placing a device on a table and reading a large, auto-scrolling transcript. The product optimizes for simplicity: one tap to listen, minimal chrome, dark high-contrast UI.

## Tech stack (current)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript (strict) |
| State | Zustand (persist + devtools) |
| Validation | Zod |
| Toasts | Sonner |
| Icons | lucide-react |
| Lint | ESLint 10 flat config (`eslint.config.mjs`) |
| Runtime | Node **22.x** (`engines` in `package.json`) |
| Package manager | **npm** (`package-lock.json` only—do not switch) |

## Repository structure

```
aidme-app/
├── public/                 # PWA manifest, icons, robots, app-link well-known files
├── src/
│   ├── app/                # Routes (App Router)
│   │   ├── layout.tsx      # Root: Header, ErrorBoundary, Toaster
│   │   ├── page.tsx        # Home → Listen
│   │   └── (content)/      # about, privacy, terms (+ Footer layout)
│   ├── assets/             # aidme.png (logo)
│   ├── components/         # UI + listen/* subcomponents
│   ├── hooks/              # Speech, permissions, viewport, media query
│   ├── lib/                # constants, speechRecognition, validation, logger
│   ├── types/              # speech.d.ts, assets.d.ts
│   └── zustand/            # useAppStore.ts
├── AGENTS.md               # This file
├── spec.md                 # Product spec + roadmap (authoritative)
├── CLAUDE.md               # Pointer to AGENTS.md
├── README.md               # Human onboarding (may lag versions—verify package.json)
└── IMPROVEMENTS.md         # Archived; pointer to spec.md
```

## Core architecture

### Request / data flow

All logic runs in the browser after static/SSR shell delivery:

1. User taps mic (`Header` or `Instructions`) → `useStartListening` → `useMicrophonePermission` (`getUserMedia`) → `setShouldListen(true)` in Zustand.
2. `useListening(shouldListen)` attaches handlers to a **singleton** `SpeechRecognition` instance (`lib/speechRecognition.ts`).
3. Final results append to in-memory `transcript[]` (capped at `MAX_TRANSCRIPT_LENGTH`); interim text shown separately.
4. On `onend`, recognition auto-restarts after `RECOGNITION_RESTART_DELAY_MS` if still mounted and `shouldListen` is true.
5. `Header` auto-stops after `LISTENING_TIMEOUT_MS` (30 minutes).

### State management

- **Store:** `src/zustand/useAppStore.ts`
- **Fields:** `shouldListen` (ephemeral, not persisted), `isTranscriptFlipped` (persisted to `localStorage` key `aidme-app_preferences_v1`)
- **Hydration:** Zod `appStateSchema` validation on rehydrate; invalid state resets to defaults

### Component pattern

- **Orchestrator:** `Listen.tsx` composes memoized `listen/*` subcomponents
- **Server components:** Legal/content pages (`AboutPage`, `PrivacyPage`, `TermsPage`)—no `"use client"` on those files
- **Client boundaries:** `Listen`, `Header`, `Instructions`, hooks, `ErrorBoundary`, interactive UI

### Routes (no middleware, no auth)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `Listen` | Main transcription |
| `/about` | `AboutPage` | Help copy |
| `/privacy` | `PrivacyPage` | Static policy |
| `/terms` | `TermsPage` | Static terms |

**Not present:** `app/api/*`, Server Actions, `middleware.ts`, `proxy.ts`, auth, Firebase, databases, cron, queues, background workers. All routes are public by design.

## Key features (shipped today)

- Real-time continuous transcription (interim + final results)
- Onboarding / instructions screen when idle with empty transcript
- Microphone permission flow with Permissions API + `getUserMedia`
- Browser unsupported state (no Web Speech API—e.g. Firefox)
- Permission and network error surfaces with retry
- Face-to-face mode: rotate transcript 180° on mobile (`isTranscriptFlipped`)
- Auto-scroll to latest text; listening indicator (CSS, no spinner library)
- 30-minute auto-stop; recognition auto-restart on silence/end
- Toast errors (Sonner) on denied permission when toggling from header
- PWA manifest + universal/app links for native wrapper
- React Native WebView `postMessage("refresh")` on logo tap
- Error boundary with dev-only stack display

## Important commands

```bash
npm install          # Install dependencies (Node 22.x)
npm run dev          # Dev server http://localhost:3000
npm run build        # Production build + TypeScript check (Next)
npm run start        # Serve production build
npm run lint         # ESLint (eslint .)
npm run test         # Vitest unit tests (single run)
npm run test:ci      # Vitest with CI=true
```

### Canonical validation (run before committing)

```bash
npm run lint && npm run test:ci && npm run build
```

There is **no** standalone `typecheck` script. `npm run build` is the TypeScript gate.

### Non-interactive testing rules

- Never use watch mode (`--watch`, Jest watch, etc.)
- Never open a headed browser or require manual login
- Do not start `npm run dev` and wait for interactive QA unless explicitly asked
- Prefer `npm run lint` and `npm run build` for CI-safe verification
- If adding tests later, use `CI=true` / single-run flags only

## Development conventions

- **TypeScript:** `strict: true`; path alias `@/*` → `src/*`
- **Lint:** ESLint 10 with `@eslint/compat` + `eslint-config-next` flat presets
- **Styling:** Tailwind 4 in `globals.css`; semantic colors—green = recording, red = danger, gray = idle
- **Constants / copy:** User-facing strings and limits in `src/lib/constants.ts`
- **Logging:** `src/lib/logger.ts` (errors always; debug in development)
- **Client directive:** `"use client"` only where hooks, browser APIs, or event handlers are required
- **Memoization:** `React.memo` on `TranscriptDisplay`, `TranscriptHeader`
- **No new backend** unless product spec explicitly adds it

## Server / client boundary

| Use Server Component | Use Client Component |
|---------------------|----------------------|
| Static legal/marketing copy | Web Speech API, `getUserMedia`, `window` |
| No interactivity | Zustand, `useEffect`, event handlers |
| `AboutPage`, `PrivacyPage`, `TermsPage` | `Listen`, `Header`, `Instructions`, hooks |

Do not import client-only modules into server components. Root `layout.tsx` is a Server Component but wraps client children (`Header`, `ErrorBoundary`).

## Route protection

**None.** All routes are public. Do not add auth middleware without an explicit product decision in `spec.md`.

## Files and systems requiring extra caution

| Area | Risk |
|------|------|
| `src/hooks/useListening.ts` | Race conditions on unmount/restart; test stop/start carefully |
| `src/lib/speechRecognition.ts` | Singleton state; breaking this causes duplicate or dead recognition |
| `src/zustand/useAppStore.ts` | Persistence schema changes affect existing users’ `localStorage` |
| `src/lib/constants.ts` | User-visible errors and legal `COMPANY_INFO` |
| `public/.well-known/*` | Native app deep linking—coordinate with mobile releases |
| `package-lock.json` / `.npmrc` | Security overrides; use `npm`, not yarn/pnpm |
| Generated | `.next/`, `next-env.d.ts`—do not hand-edit |

## Git workflow

| Branch | Role |
|--------|------|
| `main` | Stable production. **Agents must not push to `main`.** |
| `dev` | Autonomous integration branch. **Commit and push here only.** |

- **Do not** create feature branches or open PRs unless the user explicitly requests it.
- **Do not** merge `dev` → `main` autonomously.
- Before work: `git fetch origin`, `git checkout dev`, `git pull origin dev` (if remote exists).
- If `origin/dev` is missing, push with `git push -u origin dev` after first commit.
- Keep `dev` reasonably aligned with `main` via merge when instructed or when drift blocks builds.
- One **focused, PR-sized change** per autonomous run (single feature/fix/docs slice), even when committing directly to `dev`.

## Definition of done

1. Change matches `spec.md` milestone or explicit user request.
2. `npm run lint` and `npm run build` pass (or documented why not).
3. No unrelated refactors or dependency churn.
4. Server/client boundaries preserved.
5. User-facing copy centralized in `constants.ts` when adding errors.
6. Committed to `dev` with a clear message; pushed to `origin/dev` when task requires it.
7. `spec.md` updated if product behavior or roadmap changed.

## Rules for autonomous Codex runs

1. Read **AGENTS.md** and **spec.md** before editing.
2. Infer behavior from code; treat README version tables as hints only.
3. Minimal diff—smallest change that satisfies the task.
4. Never push to `main`.
5. Never switch package managers or add unrelated dependencies.
6. Do not modify generated artifacts unless regenerating via build.
7. Update `spec.md` when shipping or deferring user-visible capability.

## Stop conditions

Stop and report (do not guess) when:

- Uncommitted changes exist that are not yours and are not safe to preserve
- `git pull` / merge conflicts need human resolution
- Task requires backend, auth, or paid APIs not in repo
- Web Speech API behavior cannot be reproduced in headless CI (document manual browser verification)
- `npm run build` or `npm run lint` fails after a focused fix attempt—report logs
- User asked for `main` push, force push, or PR without explicit instruction

## Product planning reference

Roadmap and acceptance criteria: **`spec.md`** (authoritative). Do not maintain parallel roadmap files.
