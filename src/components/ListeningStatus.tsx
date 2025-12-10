import { Mic, MicOff } from "lucide-react";

interface ListeningStatusProps {
  isListening: boolean;
}

export default function ListeningStatus({ isListening }: ListeningStatusProps) {
  if (isListening) {
    return (
      <div className="flex items-center text-green-500 text-sm gap-1">
        <Mic className="animate-pulse" size={16} />
        <span>Listening</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-red-500 text-sm gap-1">
      <MicOff size={16} />
      <span>Not listening</span>
    </div>
  );
}
