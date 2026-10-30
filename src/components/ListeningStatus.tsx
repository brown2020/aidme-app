import { Mic, MicOff } from "lucide-react";

interface ListeningStatusProps {
  isListening: boolean;
  isStarting?: boolean;
}

/**
 * Status indicator showing current listening state
 * Displays animated icon and label
 * 
 * @param isListening - Whether speech recognition is currently active
 * 
 * @example
 * <ListeningStatus isListening={true} />
 */
export default function ListeningStatus({
  isListening,
  isStarting = false,
}: ListeningStatusProps) {
  const active = isListening || isStarting;
  const Icon = active ? Mic : MicOff;
  // Green = actively listening, gray = idle (not an error state)
  const colorClass = isListening
    ? "text-green-500"
    : isStarting
      ? "text-green-300"
      : "text-gray-400";
  const label = isStarting ? "Starting…" : isListening ? "Listening" : "Not listening";

  return (
    <div
      role="status"
      className={`flex items-center text-sm gap-1 ${colorClass}`}
    >
      <Icon className={active ? "animate-pulse" : undefined} size={16} />
      <span>{label}</span>
    </div>
  );
}
