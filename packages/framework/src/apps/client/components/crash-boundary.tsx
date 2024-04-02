import { Component, ReactNode } from "react";
import { ProdErrorPage } from "./error-pages";

export class CrashBoundary extends Component<
  { children?: ReactNode },
  {
    hasError: boolean;
    error: unknown;
  }
> {
  constructor(props: {}) {
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

  render() {
    if (this.state.hasError) {
      return <ProdErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}
