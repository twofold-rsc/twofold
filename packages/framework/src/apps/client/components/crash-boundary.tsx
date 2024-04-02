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

  render() {
    if (this.state.hasError) {
      return <CrashPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function CrashPage({ error }: { error: unknown }) {
  return (
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body>
        <p>
          An unrecoverable error occurred in Twofold. This is most likely a bug
          in Twofold's framework code.
        </p>
      </body>
    </html>
  );
}
