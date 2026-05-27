import { memo } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "../ui/Button";
import ListeningStatus from "../ListeningStatus";
import { LanguageSelect } from "./LanguageSelect";
import { CopyTranscriptButton } from "./CopyTranscriptButton";
import { CaptionSizeSelect } from "./CaptionSizeSelect";
import { getRecognitionLanguageLabel } from "@/lib/constants";
import type { RecognitionLanguage } from "@/lib/validation";

interface TranscriptHeaderProps {
  transcript: string[];
  interimTranscript: string;
  outputLanguage: RecognitionLanguage;
  isListening: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

/**
 * Memoized header component for transcript view
 * Contains flip control and listening status
 */
export const TranscriptHeader = memo(function TranscriptHeader({
  transcript,
  interimTranscript,
  outputLanguage,
  isListening,
  isFlipped,
  onToggleFlip,
}: TranscriptHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl">Transcription</h2>
        <p className="text-sm text-gray-400 font-normal mt-1">
          Output language: {getRecognitionLanguageLabel(outputLanguage)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <LanguageSelect variant="toolbar" />
        <CaptionSizeSelect />
        <CopyTranscriptButton
          transcript={transcript}
          interimTranscript={interimTranscript}
        />
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
