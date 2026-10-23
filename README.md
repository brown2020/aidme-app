# Aid.me

Real-time speech transcription for accessibility — closed captioning for conversations around you. Captions run in the browser via the Web Speech API with no account needed. An optional account lets you share your captions live with people you invite, who follow along on their own phones.

- Web: [https://aid.me](https://aid.me)
- iOS (WebView wrapper): [Aid Hearing on the App Store](https://apps.apple.com/us/app/aid-me-hearing/id6473455500)

## Features

Verified from the current codebase:

- **Live captions** — continuous speech-to-text with interim and final results
- **Auto-scrolling transcript** — keeps the latest speech in view; retains up to 200 sentences
- **Face-to-face mode** — flip captions so someone opposite you can read them
- **Caption size** — default, large, and extra-large
- **Language selection** — en-US/UK, es-ES/MX, fr, de, it, pt-BR, zh-CN, ja, ko, hi (BCP 47)
- **Microphone UX** — permission prompts, clear denial/network errors, Space shortcut to toggle mic
- **Browser support checks** — warns when `SpeechRecognition` / `webkitSpeechRecognition` is unavailable
- **Auto-stop** — stops listening after 30 minutes
- **Copy transcript** — clipboard export with toast feedback (Sonner)
- **PWA manifest** — installable shell (`public/manifest.json`)
- **Native bridge** — `ReactNativeWebView.postMessage("refresh")` when embedded in the iOS app
- **Accounts** — Firebase Auth with Google, email + password (verification, reset), or a passwordless email link
- **Live sharing** — invite up to 10 emails; each finalized sentence streams to Firestore and appears in real time at `/s/{sessionId}` for invited, verified viewers
- **Account page** — `/account` to manage shared sessions (view, stop, delete) and see sessions shared with you
- **Static pages** — `/about`, `/privacy`, `/terms`, `/settings`

There is no custom backend: the browser talks to Firebase directly, and `firestore.rules` controls who can read or write.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Lucide |
| Language | TypeScript 6 |
| Validation | Zod 4 |
| State | Zustand 5 (persisted preferences) |
| Toasts | Sonner |
| Images | Sharp |
| Speech | Browser Web Speech API |
| Accounts / data | Firebase 13 (Auth, Firestore, Analytics) |
| Tests | Vitest 4 + jsdom; Firestore rules via emulator |
| Lint | ESLint 10 + eslint-config-next |
| Node | `22.x` (`engines` in package.json) |

`.npmrc` sets `legacy-peer-deps=true`. Security headers (frame deny, nosniff, referrer, microphone Permissions-Policy) are set in `next.config.js`.

## Project structure

```
aidme-app/
├── src/
│   ├── app/                 # App Router: `/`, settings, about, privacy, terms
│   ├── components/          # Listen UI, settings, legal pages, layout
│   ├── hooks/               # Listening, mic permission, viewport, shortcuts
│   ├── lib/                 # Speech recognition helpers, constants, validation
│   ├── zustand/             # App preferences store
│   ├── types/               # SpeechRecognition typings + WebView bridge
│   └── assets/
├── public/                  # Icons, manifest, robots, Apple/Android app links
├── vitest.config.ts
└── .github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js **22.x**
- npm 10+
- A Chromium-based browser or Safari with Web Speech API support (and a microphone)

### Install and run

```bash
git clone https://github.com/brown2020/aidme-app.git
cd aidme-app
git checkout dev
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and allow microphone access when prompted.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the Firebase web app config (Firebase console → Project settings → Your apps). These `NEXT_PUBLIC_FIREBASE_*` values are public client identifiers, not secrets; access is enforced by `firestore.rules`. Add the same variables in your hosting provider (e.g. Vercel → Project → Settings → Environment Variables).

Without them the app still builds and captions work; sign-in and sharing show a "not available" notice.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest once |
| `npm run test:ci` | Vitest with `CI=true` |
| `npm run test:rules` | Firestore security rules tests in the emulator (needs Java 21) |
| `npm run doctor` | React Doctor full scan |
| `npm run deploy:rules` | Deploy `firestore.rules` and indexes to the `aidmehearing` project |

## Testing and CI

Unit tests live under `src/**/*.test.ts`. Firestore security rules tests live in `rules/` and run against the emulator.

GitHub Actions (`.github/workflows/ci.yml`) on `dev` / `main` and PRs: lint → typecheck → unit tests → build, plus a separate Firestore rules job (Node 22, Java 21). No repository secrets required for CI.

## Deployment

Deploy as a standard Next.js app (e.g. Vercel). Production site: [https://aid.me](https://aid.me).

App link files for the native shell:

- `public/.well-known/apple-app-site-association`
- `public/.well-known/assetlinks.json`

## Privacy note

Transcription runs in the browser via the platform speech service. Audio is never stored. Transcript text is stored in Firestore only while a signed-in user is live sharing, is readable only by that user and the verified emails they invite, and can be deleted from `/account`. See `/privacy` in the running app.

## Contributing

- `main` — production
- `dev` — integration branch

See [AGENTS.md](./AGENTS.md) and [spec.md](./spec.md). Branch from `dev` for ongoing work.

## License

[GNU Affero General Public License v3](./LICENSE.md) (AGPL-3.0).
