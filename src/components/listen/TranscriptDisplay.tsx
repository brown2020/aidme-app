import { memo } from "react";
import { getCaptionTextClassName } from "@/lib/captionSize";
import type { CaptionSize } from "@/lib/validation";

interface TranscriptDisplayProps {
  transcript: string[];
  interimTranscript: string;
  isListening: boolean;
  isFlipped: boolean;
  captionSize: CaptionSize;
  transcriptEndRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Simple CSS-based listening indicator (replaces react-spinners)
 */
function ListeningIndicator() {
  return (
    <div className="flex gap-1 items-end h-8" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-white rounded-full animate-pulse"
          style={{
            height: `${12 + (i % 3) * 8}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Memoized transcript display component
 * Efficiently renders transcript with loading states
 */
export const TranscriptDisplay = memo(function TranscriptDisplay({
  transcript,
  interimTranscript,
  isListening,
  isFlipped,
  captionSize,
  transcriptEndRef,
}: TranscriptDisplayProps) {
  const textClassName = getCaptionTextClassName(captionSize);
  const wrapperClass = `flex flex-col gap-9 w-full min-w-0 ${textClassName} ${
    isFlipped ? "rotate-180 lg:rotate-0 origin-center" : ""
  }`;

  return (
    <div className={wrapperClass}>
      {transcript.length > 0 ? (
        transcript.map((sentence, index) => (
          <p key={`${index}-${sentence}`}>{sentence}</p>
        ))
      ) : (
        <p className="text-gray-500">Waiting for speech...</p>
      )}

      {interimTranscript && (
        <div aria-label="Processing speech">{interimTranscript}</div>
      )}

      {!interimTranscript && isListening && (
        <div role="status" aria-live="polite" aria-label="Listening for speech">
          <ListeningIndicator />
          <span className="sr-only">Listening for speech...</span>
        </div>
      )}

      <div
        className="h-14 w-full shrink-0"
        ref={transcriptEndRef}
        aria-hidden="true"
      />
    </div>
  );
});
