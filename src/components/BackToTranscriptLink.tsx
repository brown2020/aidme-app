import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Prominent link back to the live transcription view
 */
export default function BackToTranscriptLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-lg text-white hover:text-gray-200 mb-4 w-fit"
    >
      <ArrowLeft size={20} aria-hidden />
      Back to transcription
    </Link>
  );
}
