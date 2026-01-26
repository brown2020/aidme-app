import Alert from "../Alert";
import Instructions from "../Instructions";

/**
 * Error state component when browser doesn't support speech recognition
 */
export function BrowserNotSupportedState() {
  return (
    <main className="flex flex-col items-center justify-center w-full h-full p-5 text-white bg-black gap-4">
      <Alert variant="error">
        Speech recognition is not supported in this browser. Please try Chrome,
        Edge, or Safari.
      </Alert>
      <Instructions />
    </main>
  );
}
