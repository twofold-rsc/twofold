import { Component, ReactNode } from "react";
import { DevErrorPage, ProdErrorPage } from "./error-pages";

export class ErrorBoundary extends Component<
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
      return process.env.NODE_ENV === "production" ? (
        <ProdErrorPage error={this.state.error} />
      ) : (
        <DevErrorPage error={this.state.error} />
      );
    }

    return this.props.children;
  }
}
