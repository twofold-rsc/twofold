import { Component, ReactNode } from "react";

export class CrashBoundary extends Component<
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

  render() {
    if (this.state.hasError) {
      return <CrashPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function CrashPage({ error }: { error: unknown }) {
  let message = error instanceof Error ? error.message : "Unknown error";
  let stack = error instanceof Error ? error.stack : "Unknown stack";

  return (
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body style={{ padding: "32px" }}>
        <p>An unrecoverable error occurred:</p>
        <div
          style={{
            marginTop: "24px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            padding: "24px",
            borderRadius: "4px",
            overflowX: "scroll",
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          }}
        >
          <p style={{ fontSize: "24px" }}>{message}</p>
          <pre style={{ marginTop: "12px" }}>{stack}</pre>
        </div>
      </body>
    </html>
  );
}
