import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="glass-apple-card p-8 rounded-3xl text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something Went Wrong</h2>
            <p className="text-white/60 text-xs mb-4">
              An unexpected error occurred. This may be a Firebase configuration or permissions issue.
            </p>
            <pre className="text-left text-rose-300 text-xs bg-black/40 p-4 rounded-xl mb-6 overflow-auto max-h-40 border border-white/10">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl glass-apple-btn font-bold text-xs text-white cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
