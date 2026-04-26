import { ErrorViewer } from "../../errors/error-viewer";
import classes from "./error-pages.module.css";

export function DevErrorPage({ error }: { error: unknown }) {
  return (
    <html className={classes.twofoldErrorPage}>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body>
        <ErrorViewer error={error} />
      </body>
    </html>
  );
}

export function ProdErrorPage({ error }: { error: unknown }) {
  let digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  let html = `${process.env.TWOFOLD_PROD_ERROR_HTML}`
    .replace("$digest-class", digest ? "" : "hidden")
    .replace("$digest", digest);

  return <html dangerouslySetInnerHTML={{ __html: html }} />;
}
