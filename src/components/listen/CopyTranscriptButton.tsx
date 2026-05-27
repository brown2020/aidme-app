"use client";

import { memo, useCallback, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { COPY_MESSAGES } from "@/lib/constants";
import {
  copyTranscriptToClipboard,
  hasCopyableTranscript,
} from "@/lib/transcript";
import { Button } from "../ui/Button";

interface CopyTranscriptButtonProps {
  transcript: string[];
  interimTranscript: string;
}

/**
 * Copies the current transcript (final + interim) to the clipboard with toast feedback.
 */
export const CopyTranscriptButton = memo(function CopyTranscriptButton({
  transcript,
  interimTranscript,
}: CopyTranscriptButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const canCopy = hasCopyableTranscript(transcript, interimTranscript);

  const handleCopy = useCallback(async () => {
    if (isCopying) return;
    setIsCopying(true);

    try {
      const result = await copyTranscriptToClipboard(
        transcript,
        interimTranscript
      );

      switch (result) {
        case "success":
          toast.success(COPY_MESSAGES.SUCCESS);
          break;
        case "empty":
          toast.message(COPY_MESSAGES.EMPTY);
          break;
        case "unsupported":
          toast.error(COPY_MESSAGES.UNSUPPORTED);
          break;
        case "failed":
          toast.error(COPY_MESSAGES.FAILED);
          break;
      }
    } finally {
      setIsCopying(false);
    }
  }, [transcript, interimTranscript, isCopying]);

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      disabled={!canCopy || isCopying}
      aria-label="Copy transcript to clipboard"
      aria-busy={isCopying}
    >
      <Copy size={16} aria-hidden />
      Copy
    </Button>
  );
});
