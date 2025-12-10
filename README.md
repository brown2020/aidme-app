# Aid.me

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5-orange)](https://zustand-demo.pmnd.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Aid.me** is a real-time speech transcription web application designed for accessibility. It uses the Web Speech API to provide live closed captioning, making it ideal for individuals with hearing difficulties, note-taking, or any situation where real-time transcription is needed.

> 🎧 **Think of it as closed captioning for your life** — place your device on a table, and let Aid.me listen and transcribe conversations around you.

## ✨ Features

- **Real-Time Transcription** — Continuous speech-to-text using the Web Speech API
- **Accessible Design** — Built with ARIA attributes and screen reader support
- **Auto-Scrolling** — Transcript automatically scrolls to show the latest speech
- **Permission Handling** — Graceful microphone permission requests with clear error messages
- **Browser Detection** — Automatically detects and warns about unsupported browsers
- **Auto-Stop Timer** — Automatically stops listening after 30 minutes to conserve resources
- **Mobile Responsive** — Optimized for both desktop and mobile browsers with viewport height handling
- **PWA Ready** — Includes web app manifest for installable experience
- **Dark Theme** — Easy-on-the-eyes dark interface for comfortable reading
- **React Native Ready** — WebView bridge support for native app wrappers

## 📱 Native App

Aid.me is also available as a native app on the [Apple App Store](https://apps.apple.com/us/app/aid-me-hearing/id6473455500) under the name **Aid Hearing, captions for life**.

## 🛠️ Tech Stack

### Dependencies

| Package                                                  | Version  | Description                     |
| -------------------------------------------------------- | -------- | ------------------------------- |
| [Next.js](https://nextjs.org/)                           | ^16.0.3  | React framework with App Router |
| [React](https://react.dev/)                              | ^19.0.0  | UI library                      |
| [React DOM](https://react.dev/)                          | ^19.0.0  | React DOM renderer              |
| [Zustand](https://zustand-demo.pmnd.rs/)                 | ^5.0.1   | Lightweight state management    |
| [Lucide React](https://lucide.dev/)                      | ^0.559.0 | Beautiful icon library          |
| [React Spinners](https://www.davidhu.io/react-spinners/) | ^0.17.0  | Loading indicators              |
| [Sharp](https://sharp.pixelplumbing.com/)                | ^0.34.1  | Image optimization for Next.js  |

### Dev Dependencies

| Package                                                                       | Version | Description                 |
| ----------------------------------------------------------------------------- | ------- | --------------------------- |
| [TypeScript](https://www.typescriptlang.org/)                                 | ^5.6.2  | Type-safe JavaScript        |
| [Tailwind CSS](https://tailwindcss.com/)                                      | ^4.0.8  | Utility-first CSS framework |
| [@tailwindcss/postcss](https://tailwindcss.com/)                              | ^4.0.8  | Tailwind PostCSS plugin     |
| [PostCSS](https://postcss.org/)                                               | ^8.4.47 | CSS transformations         |
| [ESLint](https://eslint.org/)                                                 | ^9.15.0 | Code linting                |
| [eslint-config-next](https://nextjs.org/docs/app/api-reference/config/eslint) | ^16.0.3 | Next.js ESLint config       |
| [@types/node](https://www.npmjs.com/package/@types/node)                      | ^25.0.0 | Node.js type definitions    |
| [@types/react](https://www.npmjs.com/package/@types/react)                    | ^19.0.2 | React type definitions      |
| [@types/react-dom](https://www.npmjs.com/package/@types/react-dom)            | ^19.0.2 | React DOM type definitions  |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v22.x** (required — see `engines` in package.json)
- [npm](https://www.npmjs.com/) v10 or later

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/brown2020/aidme-app.git
cd aidme-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Create optimized production build        |
| `npm run start` | Start production server                  |
| `npm run lint`  | Run ESLint for code quality              |

## 📁 Project Structure

```
aidme-app/
├── public/
│   ├── .well-known/
│   │   ├── apple-app-site-association  # iOS Universal Links
│   │   └── assetlinks.json             # Android App Links
│   ├── manifest.json                   # PWA manifest
│   ├── robots.txt                      # Search engine directives
│   ├── logo192.png                     # App icon (small)
│   └── logo512.png                     # App icon (large)
├── src/
│   ├── app/
│   │   ├── (content)/                  # Content pages route group
│   │   │   ├── layout.tsx              # Shared layout with Footer
│   │   │   ├── about/page.tsx          # About/instructions page
│   │   │   ├── privacy/page.tsx        # Privacy policy
│   │   │   └── terms/page.tsx          # Terms of service
│   │   ├── layout.tsx                  # Root layout with metadata
│   │   ├── page.tsx                    # Home page (transcription)
│   │   ├── globals.css                 # Global styles & Tailwind
│   │   └── favicon.ico                 # Favicon
│   ├── assets/
│   │   └── aidme.png                   # Logo asset
│   ├── components/
│   │   ├── Alert.tsx                   # Alert/notification component
│   │   ├── Footer.tsx                  # Footer with navigation links
│   │   ├── Header.tsx                  # Header with mic toggle
│   │   ├── Instructions.tsx            # Getting started instructions
│   │   ├── Listen.tsx                  # Main transcription component
│   │   ├── ListeningStatus.tsx         # Listening indicator
│   │   ├── PrivacyPage.tsx             # Privacy policy content
│   │   └── TermsPage.tsx               # Terms of service content
│   ├── hooks/
│   │   ├── useListening.ts             # Speech recognition lifecycle
│   │   ├── useMicrophonePermission.ts  # Permission state management
│   │   ├── useStartListening.ts        # Start/stop/toggle controls
│   │   └── useViewportHeight.ts        # Mobile viewport fix
│   ├── lib/
│   │   ├── constants.ts                # App configuration constants
│   │   └── speechRecognition.ts        # Web Speech API utilities
│   ├── types/
│   │   └── speech.d.ts                 # Speech API type definitions
│   └── zustand/
│       └── useAppStore.ts              # Global state store
├── next.config.js                      # Next.js configuration
├── postcss.config.js                   # PostCSS configuration
├── tsconfig.json                       # TypeScript configuration
└── package.json                        # Dependencies & scripts
```

## 🎯 How It Works

### Speech Recognition Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User clicks    │────▶│ Request mic      │────▶│ Initialize      │
│  microphone     │     │ permission       │     │ Web Speech API  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐     ┌────────▼────────┐
│  Add to         │◀────│ Process interim  │◀────│ Speech          │
│  transcript     │     │ & final results  │     │ detected        │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Auto-scroll    │
│  & continue     │
└─────────────────┘
```

### Architecture Overview

#### Hooks

| Hook                      | Purpose                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `useListening`            | Core speech recognition lifecycle — handles start/stop, results processing, error recovery, and auto-restart |
| `useMicrophonePermission` | Manages permission state, queries browser Permission API, handles permission requests                        |
| `useStartListening`       | High-level controls for starting, stopping, and toggling listening with navigation support                   |
| `useViewportHeight`       | Sets CSS `--vh` variable for accurate mobile viewport height (fixes iOS Safari issues)                       |

#### Components

| Component         | Purpose                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `Listen`          | Main transcription view — displays transcript, interim text, loading states, and error handling |
| `Header`          | App header with microphone toggle button, logo, and help navigation                             |
| `Instructions`    | Onboarding screen with usage instructions and start button                                      |
| `ListeningStatus` | Visual indicator showing listening/not listening state                                          |
| `Alert`           | Reusable alert component for errors, warnings, and info messages                                |
| `Footer`          | Navigation links to About, Privacy, and Terms pages                                             |

#### State Management

The app uses [Zustand](https://zustand-demo.pmnd.rs/) for minimal global state:

```typescript
// useAppStore.ts
interface AppState {
  shouldListen: boolean; // Controls whether recognition should be active
  setShouldListen: (value: boolean) => void;
}
```

### Configuration

Adjust settings in `src/lib/constants.ts`:

```typescript
// Auto-stop listening after this duration (30 minutes)
export const LISTENING_TIMEOUT_MS = 30 * 60 * 1000;

// Maximum transcript sentences to retain in memory
export const MAX_TRANSCRIPT_LENGTH = 200;

// Delay before restarting recognition after it ends (ms)
export const RECOGNITION_RESTART_DELAY_MS = 250;

// Centralized error messages
export const ERROR_MESSAGES = {
  BROWSER_NOT_SUPPORTED: "...",
  MIC_DENIED: "...",
  MIC_PERMISSION_ERROR: "...",
  MIC_NOT_ALLOWED: "...",
};

// Company info for legal pages
export const COMPANY_INFO = { ... };

// Navigation links
export const NAV_LINKS = [ ... ];
```

## 🌐 Browser Support

Aid.me requires the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), which has varying support:

| Browser | Support          | Notes                |
| ------- | ---------------- | -------------------- |
| Chrome  | ✅ Full support  | Recommended          |
| Edge    | ✅ Full support  | Chromium-based       |
| Safari  | ✅ Supported     | macOS & iOS          |
| Opera   | ✅ Supported     | Chromium-based       |
| Firefox | ❌ Not supported | No Web Speech API    |
| Brave   | ⚠️ Partial       | May require enabling |

> **Tip:** For the best experience, use Chrome or Edge on desktop, or Safari on iOS.

## ⚠️ Important Notes

### Microphone Permission

You **must allow microphone access** when prompted for the app to function. The app:

- Requests permission only when you click the microphone button
- Provides clear feedback if permission is denied
- Offers guidance on how to reset permissions in browser settings

### Privacy & Security

- **All speech processing happens locally** in your browser via the Web Speech API
- **No audio data is sent to our servers** — we don't have any backend
- Transcripts are stored only in memory and cleared on page refresh
- The app works entirely client-side

> **Note:** The Web Speech API may use cloud services (like Google's speech recognition in Chrome) depending on your browser. This is handled by your browser, not by Aid.me.

### Known Limitations

- Speech recognition may pause briefly between utterances (auto-restarts)
- Background noise can affect accuracy — speakers should be within ~6 feet
- Some browsers may require HTTPS for microphone access
- Mobile browsers may have stricter autoplay/permission policies

## 🔧 Troubleshooting

### "Speech recognition is not supported"

Your browser doesn't support the Web Speech API. Try Chrome, Edge, or Safari.

### "Microphone access was denied"

1. Click the lock/site settings icon in your browser's address bar
2. Find "Microphone" permission
3. Change it to "Allow"
4. Refresh the page

### Recognition keeps stopping

This is normal behavior — the Web Speech API stops after periods of silence. Aid.me automatically restarts recognition. If it doesn't, click the microphone button again.

### Poor transcription accuracy

- Move closer to the speaker (within 6 feet)
- Reduce background noise
- Speak clearly and at a moderate pace
- Ensure your microphone is working properly

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style (TypeScript, functional components)
- Use meaningful commit messages
- Add comments for complex logic
- Test across different browsers
- Ensure accessibility is maintained
- Run `npm run lint` before committing

### Ideas for Contribution

- [ ] Add language selection for speech recognition
- [ ] Implement transcript export (text/PDF/clipboard)
- [ ] Add keyboard shortcuts (space to toggle, etc.)
- [ ] Create transcript history with local storage
- [ ] Improve mobile Safari compatibility
- [ ] Add speech-to-text alternatives for Firefox (e.g., Whisper)
- [ ] Implement font size controls for accessibility
- [ ] Add transcript timestamps
- [ ] Create shareable transcript links

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact & Links

- **Website:** [https://aid.me](https://aid.me)
- **Email:** [info@ignitechannel.com](mailto:info@ignitechannel.com)
- **Repository:** [https://github.com/brown2020/aidme-app](https://github.com/brown2020/aidme-app)
- **Issues:** [GitHub Issues](https://github.com/brown2020/aidme-app/issues)
- **App Store:** [Aid Hearing on iOS](https://apps.apple.com/us/app/aid-me-hearing/id6473455500)

---

<p align="center">
  Made with ❤️ for accessibility<br>
  <sub>© 2024 Aid.me Team</sub>
</p>
