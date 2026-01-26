import { Mic } from "lucide-react";
import Alert from "../Alert";
import { Button } from "../ui/Button";

interface PermissionErrorStateProps {
  error: string;
  onRequestPermission: () => Promise<void>;
}

/**
 * Error state component for microphone permission errors
 * Provides user-friendly UI to request permissions again
 */
export function PermissionErrorState({
  error,
  onRequestPermission,
}: PermissionErrorStateProps) {
  return (
    <main className="flex flex-col items-center justify-center w-full h-full p-5 text-white bg-black gap-6">
      <Alert variant="warning">{error}</Alert>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl">Aid.me needs microphone access to work</p>
        <Button variant="primary" size="lg" onClick={onRequestPermission}>
          <Mic size={20} />
          Request Microphone Access
        </Button>
        <p className="text-sm text-gray-400">
          If you&apos;ve denied permission, you&apos;ll need to reset it in
          your browser settings
        </p>
      </div>
    </main>
  );
}
