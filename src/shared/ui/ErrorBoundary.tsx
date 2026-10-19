import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  name: string;
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

/**
 * Wrap each major region (viewport, each panel) so one failure does not blank the whole app.
 * Hook `componentDidCatch` up to Application Insights / Sentry here.
 */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div role="alert" className="block error">
        <h2>{this.props.name} failed to load</h2>
        <p className="hint">{error.message}</p>
        <button className="btn" onClick={this.reset}>
          Try again
        </button>
      </div>
    );
  }
}
