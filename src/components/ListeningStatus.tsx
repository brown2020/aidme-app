import { Mic, MicOff } from "lucide-react";

interface ListeningStatusProps {
  isListening: boolean;
}

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
