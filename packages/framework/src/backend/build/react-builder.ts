import { build } from "esbuild";

export class ReactBuilder {
  async build() {
    await build({
      bundle: true,
      format: "esm",
      stdin: {
        contents: `
          import * as React from 'react';
          export { React };
        `,
        resolveDir: "./",
        sourcefile: "react.js",
      },
      logLevel: "info",
      outdir: "./.twofold/react/",
      // entryNames: "entries/[name]-[hash]",
      metafile: true,
    });
  }
}
