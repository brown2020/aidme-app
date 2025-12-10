# Aid.me

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
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
- **Mobile Responsive** — Optimized for both desktop and mobile browsers
- **PWA Ready** — Includes web app manifest for installable experience
- **Dark Theme** — Easy-on-the-eyes dark interface for comfortable reading

## 📱 Native App

Aid.me is also available as a native app on the [Apple App Store](https://apps.apple.com/us/app/aid-me-hearing/id6473455500) under the name **Aid Hearing, captions for life**.

## 🛠️ Tech Stack

### Core Framework

| Package                                       | Version | Description                     |
| --------------------------------------------- | ------- | ------------------------------- |
| [Next.js](https://nextjs.org/)                | ^16.0.3 | React framework with App Router |
| [React](https://react.dev/)                   | ^19.0.0 | UI library                      |
| [TypeScript](https://www.typescriptlang.org/) | ^5.6.2  | Type-safe JavaScript            |

### State Management & UI

| Package                                                  | Version  | Description                  |
| -------------------------------------------------------- | -------- | ---------------------------- |
| [Zustand](https://zustand-demo.pmnd.rs/)                 | ^5.0.1   | Lightweight state management |
| [Tailwind CSS](https://tailwindcss.com/)                 | ^4.0.8   | Utility-first CSS framework  |
| [Lucide React](https://lucide.dev/)                      | ^0.559.0 | Beautiful icon library       |
| [React Spinners](https://www.davidhu.io/react-spinners/) | ^0.17.0  | Loading indicators           |

### Build & Development

| Package                                   | Version | Description         |
| ----------------------------------------- | ------- | ------------------- |
| [Sharp](https://sharp.pixelplumbing.com/) | ^0.34.1 | Image optimization  |
| [ESLint](https://eslint.org/)             | ^9.15.0 | Code linting        |
| [PostCSS](https://postcss.org/)           | ^8.4.47 | CSS transformations |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v22.x** (required)
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

### Production Build

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
aidme-app/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── logo192.png            # App icons
│   └── logo512.png
├── src/
│   ├── app/
│   │   ├── (content)/         # Content pages route group
│   │   │   ├── about/         # About page
│   │   │   ├── privacy/       # Privacy policy
│   │   │   └── terms/         # Terms of service
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Home page (transcription)
│   │   └── globals.css        # Global styles & Tailwind config
│   ├── assets/
│   │   └── aidme.png          # Logo asset
│   ├── components/
│   │   ├── Alert.tsx          # Alert/notification component
│   │   ├── Footer.tsx         # Footer with navigation links
│   │   ├── Header.tsx         # Header with mic toggle
│   │   ├── Instructions.tsx   # Getting started instructions
│   │   └── Listen.tsx         # Main transcription component
│   ├── hooks/
│   │   └── useListening.ts    # Speech recognition hook
│   ├── lib/
│   │   └── constants.ts       # App configuration constants
│   ├── types/
│   │   └── speech.d.ts        # Speech API type definitions
│   └── zustand/
│       └── useAppStore.ts     # Global state store
└── package.json
```

## 🎯 How It Works

### Speech Recognition Flow

1. **User clicks microphone** → Requests microphone permission
2. **Permission granted** → Initializes Web Speech API
3. **Speech detected** → Processes interim results in real-time
4. **Sentence complete** → Adds finalized text to transcript
5. **Auto-restart** → Continues listening after brief pauses

### Key Components

- **`useListening` Hook** — Manages the Web Speech API lifecycle, handles permissions, errors, and auto-restart logic
- **`useAppStore`** — Zustand store managing the `shouldListen` state across components
- **`Listen` Component** — Renders the transcript with auto-scroll and loading states
- **`Header`** — Contains the microphone toggle with visual feedback

### Configuration

Adjust settings in `src/lib/constants.ts`:

```typescript
// Auto-stop listening after this duration (30 minutes)
export const LISTENING_TIMEOUT_MS = 30 * 60 * 1000;

// Maximum transcript sentences to retain
export const MAX_TRANSCRIPT_LENGTH = 200;

// Delay before restarting recognition (ms)
export const RECOGNITION_RESTART_DELAY_MS = 250;
```

## 🌐 Browser Support

Aid.me requires the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), which has varying support:

| Browser | Support                  |
| ------- | ------------------------ |
| Chrome  | ✅ Full support          |
| Edge    | ✅ Full support          |
| Safari  | ✅ Supported (macOS/iOS) |
| Firefox | ❌ Not supported         |
| Opera   | ✅ Supported             |

> **Note:** For the best experience, use Chrome or Edge. Safari works but may have some limitations.

## ⚠️ Important Notes

### Microphone Permission

You **must allow microphone access** when prompted for the app to function. The app:

- Requests permission only when you click the microphone button
- Provides clear feedback if permission is denied
- Offers guidance on how to reset permissions in browser settings

### Privacy

- **All speech processing happens locally** in your browser
- No audio data is sent to external servers
- Transcripts are stored only in memory and cleared on page refresh

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

### Ideas for Contribution

- [ ] Add language selection for speech recognition
- [ ] Implement transcript export (text/PDF)
- [ ] Add keyboard shortcuts
- [ ] Create transcript history/save feature
- [ ] Improve mobile Safari compatibility
- [ ] Add speech-to-text alternatives for Firefox

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

- **Email:** [info@ignitechannel.com](mailto:info@ignitechannel.com)
- **Repository:** [https://github.com/brown2020/aidme-app](https://github.com/brown2020/aidme-app)
- **Issues:** [GitHub Issues](https://github.com/brown2020/aidme-app/issues)

---

<p align="center">
  Made with ❤️ for accessibility
</p>
