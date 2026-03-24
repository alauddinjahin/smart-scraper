'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children:    ReactNode;
  fallback?:   ReactNode;
  renderError?: (error: Error, reset: () => void) => ReactNode;
  onError?:    (error: Error, info: ErrorInfo) => void;
  context?:    string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.context ? ` — ${this.props.context}` : ''}]`, error, info);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback, renderError, context } = this.props;

    if (!error) return children;

    if (renderError) return renderError(error, this.reset);

    if (fallback) return fallback;

    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center rounded-[var(--radius-lg)] border"
        style={{
          background: 'var(--danger-subtle)',
          borderColor: 'var(--danger)',
          borderWidth: '0.5px',
        }}
      >
        <AlertTriangle size={20} style={{ color: 'var(--danger-text)', marginBottom: 10 }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--danger-text)' }}>
          {context ? `${context} failed to load` : 'Something went wrong'}
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {error.message}
        </p>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[var(--radius-md)] text-xs font-medium border transition-colors"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger-text)',
            background: 'transparent',
          }}
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
