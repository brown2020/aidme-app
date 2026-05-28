import { memo } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "../ui/Button";
import ListeningStatus from "../ListeningStatus";
import { CopyTranscriptButton } from "./CopyTranscriptButton";

interface TranscriptHeaderProps {
  transcript: string[];
  interimTranscript: string;
  isListening: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

/**
 * Minimal transcript toolbar: copy, face-to-face mode, and status
 */
export const TranscriptHeader = memo(function TranscriptHeader({
  transcript,
  interimTranscript,
  isListening,
  isFlipped,
  onToggleFlip,
}: TranscriptHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-2xl">Transcription</h2>
      <div className="flex flex-wrap items-center gap-3">
        <CopyTranscriptButton
          transcript={transcript}
          interimTranscript={interimTranscript}
        />
        <Button
          variant={isFlipped ? "primary" : "secondary"}
          size="sm"
          onClick={onToggleFlip}
          className="lg:hidden"
          aria-pressed={isFlipped}
          aria-label={
            isFlipped
              ? "Face-to-face view is on. Tap to return to normal orientation."
              : "Face-to-face view is off. Tap to flip captions for someone across the table."
          }
        >
          <RotateCw
            size={16}
            className={isFlipped ? "rotate-180 transition-transform" : "transition-transform"}
            aria-hidden
          />
          <span>{isFlipped ? "Face-to-face: On" : "Face-to-face: Off"}</span>
        </Button>
        <ListeningStatus isListening={isListening} />
      </div>
    </div>
  );
});
