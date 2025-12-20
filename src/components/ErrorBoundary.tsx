import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 max-w-md">
            <h2 className="text-2xl font-serif italic font-bold text-rose-500 mb-4">Oops! Something went wrong.</h2>
            <p className="text-paper-text/60 text-sm mb-6">
              申し訳ありません。アプリの読み込み中にエラーが発生しました。
            </p>
            <pre className="bg-rose-50 p-4 rounded-xl text-rose-700 text-[10px] overflow-auto text-left mb-6 max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-paper-text text-cream-50 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              再読み込みする
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

