import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-zinc-400 text-sm mb-6">
            The app ran into an unexpected error. You can reset your local data
            to recover — your exported JSON files will still work for re-import.
          </p>
          <button
            onClick={this.handleReset}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-semibold transition-colors"
          >
            Reset app data &amp; reload
          </button>
        </div>
      </div>
    );
  }
}
