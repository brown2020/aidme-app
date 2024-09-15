# Aid.me

Aid.me is a modern web application built with Next.js 14, React, Zustand, and Tailwind CSS. The app leverages the Speech Recognition API to provide real-time transcription of spoken words, making it ideal for accessibility purposes, note-taking, or voice-driven interfaces.

## Features

- **Real-Time Speech Recognition:** Utilizes the Web Speech API for real-time speech-to-text conversion.
- **Interactive UI:** Built with React and Tailwind CSS for a responsive and interactive user interface.
- **State Management:** Uses Zustand for lightweight and flexible state management.
- **Loading Spinner:** Provides visual feedback during speech processing using `react-spinners`.
- **Easy Setup:** Get started with a few commands, thanks to Next.js's development environment.

## Important Note

To use the speech recognition feature, **you must allow microphone permissions** when prompted by your browser or device. This is essential for the app to capture and transcribe spoken words effectively.

## React Native Version

Aid.me is also available as a React Native app on the [Apple App Store](https://apps.apple.com/us/app/aid-me-hearing/id6473455500) under the name **Aid Hearing, captions for life**. This app continuously transcribes the speech around you, acting like closed captioning for your life. If you have trouble hearing, just put your phone or iPad on the table, and let Aid.me listen and transcribe for you.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (v8 or later)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/brown2020/aidme-app.git
cd aidme-app
npm install
```

### Running the Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production

To create a production build, run:

```bash
npm run build
```

This will generate an optimized build in the `.next` folder.

### Starting the Production Server

After building for production, you can start the server with:

```bash
npm run start
```

### Linting

To run the linter and ensure code quality:

```bash
npm run lint
```

## Project Structure

- **`/hooks/useListening.ts`**: Custom hook for handling speech recognition logic.
- **`/zustand/useAppStore.ts`**: Zustand store for managing application state.
- **`/components/Listen.tsx`**: Main component for displaying the transcription and handling user interactions.

## Contributing

If you'd like to contribute to Aid.me, please fork the repository and submit a pull request. For any major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or suggestions, please contact [info@ignitechannel.com](mailto:info@ignitechannel.com).

## Repository

Find the repository at: [https://github.com/brown2020/aidme-app](https://github.com/brown2020/aidme-app)
