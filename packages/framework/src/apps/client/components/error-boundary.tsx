import { Component, ReactNode } from "react";
import { Stylesheet } from "./stylesheet";
import { ErrorViewer } from "../../errors/error-viewer";

export class ErrorBoundary extends Component<
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

function ErrorPage({ error }: { error: unknown }) {
  return (
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <Stylesheet href="/_twofold/errors/app.css" />
      </head>
      <body>
        <ErrorViewer error={error} />
      </body>
    </html>
  );
}
