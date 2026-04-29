import { Component, type ReactNode, type ErrorInfo } from 'react'
import Timeline from './components/Timeline'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Timeline crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-red-400 text-sm">Something went wrong: {this.state.error}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs text-zinc-400 hover:text-zinc-200 underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Timeline />
    </ErrorBoundary>
  )
}
