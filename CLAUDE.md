# CLAUDE.md - Aid.me Project Guide

## Project Overview

Aid.me is a real-time speech transcription web application for accessibility. It provides live closed captioning using the Web Speech API, designed for individuals with hearing difficulties, note-taking, and situations requiring real-time transcription.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Zustand, Tailwind CSS 4, Zod

## Quick Commands

```bash
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint (requires ESLint 9 flat config)
```

**Node Version**: 22.x required (see `engines` in package.json)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Header, Toaster, ErrorBoundary)
│   ├── page.tsx            # Home page (transcription interface)
│   └── (content)/          # Route group for content pages
│       ├── about/          # About Aid.me
│       ├── privacy/        # Privacy policy
│       └── terms/          # Terms of service
├── components/             # React components
│   ├── Listen.tsx          # Main transcription orchestrator
│   ├── AboutPage.tsx       # About page content
│   ├── listen/             # Listen sub-components (memoized)
│   │   ├── TranscriptDisplay.tsx
│   │   ├── TranscriptHeader.tsx
│   │   ├── BrowserNotSupportedState.tsx
│   │   └── PermissionErrorState.tsx
│   └── ui/                 # Reusable UI components
│       └── Button.tsx      # Button with variants (primary, secondary, danger, ghost, recording)
├── hooks/                  # Custom React hooks
│   ├── useListening.ts     # Speech recognition lifecycle (with race condition protection)
│   ├── useMicrophonePermission.ts
│   ├── useStartListening.ts
│   ├── useMediaQuery.ts
│   └── useViewportHeight.ts
├── lib/                    # Utilities
│   ├── constants.ts        # App configuration & error messages
│   ├── speechRecognition.ts # Web Speech API singleton
│   ├── validation.ts       # Zod schemas
│   └── logger.ts           # Simple logging (errors always, debug in dev only)
├── zustand/
│   └── useAppStore.ts      # Global state store with persistence
└── types/
    └── speech.d.ts         # Web Speech API type declarations
```

## Architecture Patterns

### State Management (Zustand)
- Store: `/src/zustand/useAppStore.ts`
- State: `shouldListen` (controls recognition), `isTranscriptFlipped` (mobile view)
- Persists user preferences to localStorage (`aidme-app_preferences_v1`)
- Validated with Zod on hydration

### Speech Recognition Lifecycle
- Singleton pattern in `speechRecognition.ts` prevents multiple instances
- `useListening` hook manages start/stop with race condition protection
- Uses `isMountedRef` to prevent restart after cleanup
- Network errors shown to users (not silently swallowed)

### Custom Hooks
- `useListening`: Core speech recognition logic, results processing, error recovery
- `useMicrophonePermission`: Permission state management with Permissions API
- `useStartListening`: High-level controls with toast feedback
- `useMediaQuery`: Responsive breakpoint detection
- `useViewportHeight`: Mobile viewport fix for 100vh issues

### Component Pattern
- Orchestrator pattern: `Listen.tsx` composes smaller, memoized sub-components
- Error states as separate components
- Client components only where needed
- Button component with semantic variants (recording = green, danger = red)

## Key Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root setup with ErrorBoundary, Toaster, Header |
| `src/components/Listen.tsx` | Main transcription component |
| `src/hooks/useListening.ts` | Speech recognition lifecycle |
| `src/zustand/useAppStore.ts` | Global state |
| `src/lib/speechRecognition.ts` | Web Speech API singleton |
| `src/lib/constants.ts` | All configurable values |

## Configuration

### Constants (`/src/lib/constants.ts`)
- `LISTENING_TIMEOUT_MS`: 30 minutes auto-stop
- `MAX_TRANSCRIPT_LENGTH`: 200 sentences retained
- `RECOGNITION_RESTART_DELAY_MS`: 250ms restart delay
- `ERROR_MESSAGES`: User-facing error strings (including network errors)

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)

## Color Semantics

Consistent color scheme across the app:
- **Green**: Active/recording state (mic button when listening, status indicator)
- **Red**: Error/danger state (permission denied)
- **Gray**: Idle/inactive state

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge | Full (recommended) |
| Safari | Yes |
| Firefox | No (no Web Speech API) |

## Code Conventions

- TypeScript strict mode enabled
- ESLint 9 with flat config (`eslint.config.mjs`)
- Tailwind CSS 4 for styling (dark theme)
- No external spinner library (CSS-based loading indicators)
- `"use client"` only where necessary
- React.memo for expensive components
- Zod for runtime validation

## Important Notes

- **No backend**: All processing is client-side
- **No data collection**: Transcripts stored only in memory
- **Microphone permissions**: Requires explicit browser permission
- **Web Speech API**: May use cloud services depending on browser
- **PWA ready**: Manifest and icons in `/public`
- **Network errors**: Shown to users (not silently swallowed)

## Testing

No test framework currently installed. Recommended setup:
- Jest for unit tests
- React Testing Library for components
