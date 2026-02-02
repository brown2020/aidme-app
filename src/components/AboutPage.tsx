import Link from "next/link";

/**
 * About page - information about Aid.me
 */
export default function AboutPage() {
  return (
    <div className="text-wrapper">
      <h3>About Aid.me</h3>

      <p>
        Aid.me is a real-time speech transcription tool designed for
        accessibility. It provides live closed captioning for conversations,
        making communication easier for individuals who are deaf or hard of
        hearing.
      </p>

      <h4>How It Works</h4>
      <p>
        Aid.me uses your device&apos;s microphone and the Web Speech API to
        transcribe speech in real-time. Simply click the microphone button to
        start, and spoken words will appear on your screen as text.
      </p>

      <h4>Getting Started</h4>
      <ul>
        <li>Click the microphone icon in the header to begin listening</li>
        <li>Allow microphone access when prompted by your browser</li>
        <li>Position speakers within 6 feet for best results</li>
        <li>Speak clearly and at a moderate pace</li>
      </ul>

      <h4>Features</h4>
      <ul>
        <li>Real-time speech-to-text transcription</li>
        <li>Face-to-face mode for showing captions to someone across from you</li>
        <li>Works offline once loaded (transcription may use cloud services)</li>
        <li>No account required - completely free to use</li>
        <li>Privacy-focused: transcripts are never stored or sent to servers</li>
      </ul>

      <h4>Browser Support</h4>
      <p>
        Aid.me works best in Chrome, Edge, and Safari. Firefox is not currently
        supported as it lacks the Web Speech API.
      </p>

      <h4>Privacy</h4>
      <p>
        Your privacy matters. All transcription happens in real-time and is
        never stored. When you close the app, your transcript is gone. Read our
        full <Link href="/privacy" className="underline">Privacy Policy</Link>{" "}
        for more details.
      </p>

      <h4>Open Source</h4>
      <p>
        Aid.me is open source software. You can view the code, report issues,
        or contribute on{" "}
        <a
          href="https://github.com/brown2020/aidme-app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  );
}
