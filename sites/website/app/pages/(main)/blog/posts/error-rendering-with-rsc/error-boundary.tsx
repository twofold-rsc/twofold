import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<{
  children: ReactNode;
  onReset: () => void;
}> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  reset() {
    this.setState({ error: null });
    this.props.onReset();
  }

  render() {
    if (this.state.error) {
      return (
        <div className="space-y-4">
          <p className="max-w-prose leading-normal">
            The above RSC Stream contains an error and cannot be rendered by
            your browser.
          </p>
          <button
            className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white"
            onClick={this.reset.bind(this)}
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
