import { memo } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "../ui/Button";
import ListeningStatus from "../ListeningStatus";

interface TranscriptHeaderProps {
  isListening: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

/**
 * Memoized header component for transcript view
 * Contains flip control and listening status
 */
export const TranscriptHeader = memo(function TranscriptHeader({
  isListening,
  isFlipped,
  onToggleFlip,
}: TranscriptHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl">Transcription</h2>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleFlip}
          className="lg:hidden"
          aria-pressed={isFlipped}
          aria-label={
            isFlipped
              ? "Exit face-to-face transcription view (normal orientation)"
              : "Enable face-to-face transcription view (upside down)"
          }
        >
          <RotateCw size={16} />
          Face-to-face
        </Button>
        <ListeningStatus isListening={isListening} />
      </div>
    </div>
  );
});
