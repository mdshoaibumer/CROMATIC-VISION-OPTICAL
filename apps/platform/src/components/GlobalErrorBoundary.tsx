import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, ServerCrash, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// React 19 compatible error boundary using class with explicit typing
class ErrorBoundaryInner extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // @ts-expect-error - React 19 class component type inference limitation
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent handles the UI
    }
    // @ts-expect-error - React 19 class component type inference limitation
    return this.props.children;
  }
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  const handleError = useCallback((error: Error) => {
    setErrorState({ hasError: true, error });
  }, []);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      setErrorState({ hasError: true, error: event.error || new Error(event.message) });
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      setErrorState({
        hasError: true,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      });
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handlePromiseRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handlePromiseRejection);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (errorState.hasError) {
    const isNetworkError =
      errorState.error?.message.toLowerCase().includes("failed to fetch") ||
      errorState.error?.message.toLowerCase().includes("network") ||
      errorState.error?.message.includes("HTTP 5") ||
      errorState.error?.message.includes("offline") ||
      errorState.error?.message.includes("unreachable");

    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-surface-2 border border-zinc-900 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            {isNetworkError ? <ServerCrash className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
              {isNetworkError ? "System Offline" : "Something Went Wrong"}
            </p>
            <h2 className="text-xl font-serif font-black">
              {isNetworkError ? "Backend Unreachable" : "An Error Occurred"}
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isNetworkError
                ? "The backend service is currently unresponsive. Please check your connection and try again."
                : "An unexpected error occurred. Please refresh the page to continue."}
            </p>
          </div>

          <div className="bg-black/50 border border-zinc-900 rounded-xl p-4 text-left overflow-hidden">
            <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Error Details:</p>
            <code className="text-xs font-mono text-red-400 break-words block">
              {errorState.error?.message || "Unknown Error"}
            </code>
          </div>

          <button
            onClick={handleRetry}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black text-xs font-mono font-bold tracking-widest uppercase rounded-full flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundaryInner onError={handleError}>
      {children}
    </ErrorBoundaryInner>
  );
}
