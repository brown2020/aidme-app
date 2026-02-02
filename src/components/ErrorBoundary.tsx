"use client";

import { Component, ReactNode } from "react";
import { logger } from "@/lib/logger";
import Alert from "./Alert";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for graceful error handling
 * Catches React errors and displays user-friendly fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("React Error Boundary caught an error", {
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-5 bg-black gap-4">
          <Alert variant="error">
            Something went wrong. Please refresh the page to try again.
          </Alert>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="text-xs text-red-400 overflow-auto max-w-full">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
