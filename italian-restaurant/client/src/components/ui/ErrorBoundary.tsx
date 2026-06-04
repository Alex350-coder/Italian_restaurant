import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

const MAX_RETRIES = 3;

function DefaultErrorFallback({
  error,
  onRetry,
  retryCount,
}: {
  error: Error;
  onRetry: () => void;
  retryCount: number;
}) {
  const canRetry = retryCount < MAX_RETRIES;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="text-6xl">🍝</div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-noche-negro">
            Qualcosa è andato storto
          </h2>
          <p className="text-tierra-marron">
            Ci scusiamo per l'inconveniente. Il nostro chef sta cercando di risolvere il problema.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="bg-red-50 rounded-lg p-4 text-left">
            <p className="text-xs font-mono text-red-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {canRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-rosso-pomodoro text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-colors active:scale-95"
            >
              Riprova {retryCount > 0 && `(${retryCount}/${MAX_RETRIES})`}
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full border-2 border-gray-300 text-noche-negro px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Ricarica Pagina
          </button>
          {!canRetry && (
            <p className="text-sm text-tierra-marron">
              Raggiunto il numero massimo di tentativi. Ricarica la pagina.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (import.meta.env.DEV) {
      console.group('🔴 ErrorBoundary caught an error');
      console.error(error);
      console.error(errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}
