'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  /** Rendered instead of the default panel; receives a retry callback. */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Bumped by the parent to force a remount of the subtree on retry. */
  onRetry?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors from the visualizer subtree.
 *
 * Necessary because Three.js failures (a lost context, an unsupported
 * extension, a driver bug) surface as ordinary exceptions during a React
 * commit, and without a boundary they blank the entire page — taking the
 * algorithm's explanation and complexity content down with the canvas that
 * actually broke.
 *
 * Must stay a class: `componentDidCatch` has no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No telemetry pipeline yet; the console is what a developer will look at.
    console.error('[AlgoVIZ] Visualizer error:', error, info.componentStack);
  }

  private retry = (): void => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.retry);

    return (
      <div className="panel flex flex-col items-start gap-3 p-6">
        <h3 className="text-sm font-semibold text-content-primary">The visualizer stopped</h3>
        <p className="text-xs text-content-muted">
          {error.message || 'An unexpected rendering error occurred.'}
        </p>
        <Button variant="outline" size="sm" onClick={this.retry}>
          Reload visualizer
        </Button>
      </div>
    );
  }
}
