import { ErrorViewer } from "../../errors/error-viewer";
import { Stylesheet } from "./stylesheet";

function DevErrorPage({ error }: { error: unknown }) {
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

function ProdErrorPage({ error }: { error: unknown }) {
  let message =
    error instanceof Error ? error.message : "Internal server error";

  let html = `${process.env.TWOFOLD_PRODUCTION_ERROR_HTML}`.replace(
    "$message",
    message,
  );

  return <html dangerouslySetInnerHTML={{ __html: html }} />;
}

export const ErrorPage =
  process.env.NODE_ENV === "production" ? ProdErrorPage : DevErrorPage;
