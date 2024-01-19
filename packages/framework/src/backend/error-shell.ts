import { serializeError } from "serialize-error";

let template = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <title>Error</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script type="text/javascript">
        window.__error = $error;
      </script>
      <script type="module" src="/_twofold/errors/app.js"></script>
      <link rel="stylesheet" href="/_twofold/errors/app.css">
      <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
    </head>
    <body>
      <div id="root">
      </div>
    </body>
  </html>`;

export function shell(error: Error) {
  let errorString = JSON.stringify(serializeError(error));
  let html = template.replace("$error", errorString);
  return html;
}
