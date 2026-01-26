import { Mic, MicOff } from "lucide-react";

interface ListeningStatusProps {
  isListening: boolean;
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
export default function ListeningStatus({ isListening }: ListeningStatusProps) {
  const Icon = isListening ? Mic : MicOff;
  const colorClass = isListening ? "text-green-500" : "text-red-500";
  const label = isListening ? "Listening" : "Not listening";

  return (
    <div className={`flex items-center text-sm gap-1 ${colorClass}`}>
      <Icon className={isListening ? "animate-pulse" : undefined} size={16} />
      <span>{label}</span>
    </div>
  );
}




