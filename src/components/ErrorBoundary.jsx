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
        <div className="min-h-screen flex items-center justify-center px-4 bg-[#111318] text-[#E2E2E6]">
          <div className="p-8 sm:p-10 rounded-[32px] bg-[#1D2024] border border-white/10 text-center max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-[#5C2822] text-[#FFB4AB] border border-[#FFB4AB]/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-[#E2E2E6] mb-2 tracking-tight">Something Went Wrong</h2>
            <p className="text-[#8E9196] text-xs mb-4">
              An unexpected error occurred. This may be a Firebase configuration or network issue.
            </p>
            <pre className="text-left text-[#FFB4AB] text-xs bg-[#16191D] p-4 rounded-2xl mb-6 overflow-auto max-h-40 border border-white/5 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#272A2F] hover:bg-[#32353A] border border-white/10 font-bold text-xs text-[#E2E2E6] cursor-pointer transition"
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
