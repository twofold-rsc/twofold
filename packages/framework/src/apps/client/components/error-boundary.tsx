import { Component, ReactNode } from "react";
import { ErrorViewer } from "../../errors/error-viewer";
import Stylesheet from "../../../components/stylesheet";

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
    this.setState({
      hasError: false,
      error: null,
    });
  };

  componentDidMount(): void {
    window.addEventListener("popstate", this.onPopState);
  }

  componentWillUnmount(): void {
    window.removeEventListener("popstate", this.onPopState);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function ErrorPage({ error }: { error: unknown }) {
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
