import { Component, type ReactNode } from "react";
import ErrorPage from "./error-page";

/**
 * This error boundary wraps the router internals in the browser, handling errors that arrive as part of client-initiated navigation in the browser, as well as catching any errors that occur in client components or returned via server actions.
 */
export class BrowserErrorBoundary extends Component<
  { children?: ReactNode },
  {
    hasError: boolean;
    error: unknown;
  }
> {
  constructor(props: object) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      error,
      hasError: true,
    };
  }

  onPopState = (_event: PopStateEvent) => {
    if (this.state.hasError) {
      window.location.reload();
    }
  };

  componentDidMount(): void {
    window.addEventListener("popstate", this.onPopState);
  }

  componentWillUnmount(): void {
    window.removeEventListener("popstate", this.onPopState);
  }

  reset() {
    this.setState({
      hasError: false,
      error: null,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}
