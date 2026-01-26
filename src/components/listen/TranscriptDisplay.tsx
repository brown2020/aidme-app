import { memo } from "react";
import { ScaleLoader } from "react-spinners";

interface TranscriptDisplayProps {
  transcript: string[];
  interimTranscript: string;
  isListening: boolean;
  isFlipped: boolean;
  transcriptEndRef: React.RefObject<HTMLDivElement | null>;
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
  transcriptEndRef,
}: TranscriptDisplayProps) {
  const wrapperClass = `flex flex-col gap-9 ${
    isFlipped ? "rotate-180 lg:rotate-0 origin-center" : ""
  }`;

  return (
    <div className={wrapperClass}>
      {transcript.length > 0 ? (
        transcript.map((sentence, index) => <p key={index}>{sentence}</p>)
      ) : (
        <p className="text-gray-500">Waiting for speech...</p>
      )}

      {interimTranscript && (
        <div aria-label="Processing speech">{interimTranscript}</div>
      )}

      {!interimTranscript && isListening && (
        <div aria-label="Listening for speech">
          <ScaleLoader color="#ffffff" />
        </div>
      )}

      <div
        className="h-14 w-full"
        ref={transcriptEndRef}
        aria-hidden="true"
      />
    </div>
  );
});
