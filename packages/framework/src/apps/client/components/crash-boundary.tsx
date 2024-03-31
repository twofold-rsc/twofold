import { Component, ReactNode } from "react";

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

  onPopState = (_event: PopStateEvent) => {
    if (this.state.hasError) {
      console.log("crash boundary pop state");
    }
  };

  componentDidMount(): void {
    window.addEventListener("popstate", this.onPopState);
  }

  componentWillUnmount(): void {
    window.removeEventListener("popstate", this.onPopState);
  }

  render() {
    if (this.state.hasError) {
      console.log("rendering crash page");
      return <CrashPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

function CrashPage({ error }: { error: unknown }) {
  console.log("crash page");
  let message =
    error instanceof Error ? error.message : "Internal server error";

  let html = `${process.env.TWOFOLD_CRASH_HTML}`.replace("$message", message);

  return <html dangerouslySetInnerHTML={{ __html: html }} />;
}
