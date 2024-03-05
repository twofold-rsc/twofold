import { build, transform } from "esbuild";
import { BuildMetafile } from "../build";
import {
  clientComponentMapPlugin,
  ClientComponentOutput,
} from "./plugins/client-component-map-plugin.js";
import { readFile } from "fs/promises";
import { transformAsync } from "@babel/core";
import { fileURLToPath } from "url";
import { appSrcDir, cwdUrl, frameworkSrcDir } from "../files.js";
import { dirname } from "path";
import { RSCBuilder } from "./rsc-builder";
import * as path from "path";

export class BrowserAppBuilder {
  #metafile?: BuildMetafile;
  #error?: Error;
  #rscBuilder: RSCBuilder;
  #clientComponentOutputMap = new Map<string, ClientComponentOutput>();

  constructor({ rscBuilder }: { rscBuilder: RSCBuilder }) {
    this.#rscBuilder = rscBuilder;
  }

  get clientEntryPoints() {
    return Array.from(this.#rscBuilder.clientComponents).map(
      (component) => component.path,
    );
  }

  get clientComponentOutputMap() {
    return this.#clientComponentOutputMap;
  }

  set clientComponentOutputMap(map: Map<string, ClientComponentOutput>) {
    this.#clientComponentOutputMap = map;
  }

  async build() {
    this.#metafile = undefined;
    this.#error = undefined;

    try {
      let results = await build({
        bundle: true,
        format: "esm",
        jsx: "automatic",
        logLevel: "error",
        entryPoints: [
          ...this.clientEntryPoints,
          this.initializeBrowserPath,
          this.srcSSRAppPath,
        ],
        entryNames: "entries/[name]-[hash]",
        outdir: "./.twofold/browser-app/",
        outbase: "src",
        splitting: true,
        chunkNames: "chunks/[name]-[hash]",
        metafile: true,
        plugins: [
          clientComponentMapPlugin({ builder: this }),
          {
            name: "react-refresh",
            setup(build) {
              // only refresh files in src
              let appSrcPath = fileURLToPath(appSrcDir);
              // lookup the module id

              build.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
                if (path.startsWith(appSrcPath)) {
                  let contents = await readFile(path, "utf-8");

                  let moduleName = path
                    .slice(appSrcPath.length)
                    .replace(/\.tsx$/, "");

                  // esbuild transform ts to js
                  let { code } = await transform(contents, {
                    loader: "tsx",
                    jsx: "automatic",
                    format: "esm",
                  });

                  // babel transform
                  let result = await transformAsync(code, {
                    plugins: ["react-refresh/babel"],
                    configFile: false,
                    babelrc: false,
                  });

                  if (result?.code && /\$RefreshReg\$\(/.test(result.code)) {
                    let start = `
                      let prevRefreshReg = undefined;
                      let prevRefreshSig = undefined;
                      if (typeof window !== 'undefined') {
                        prevRefreshReg = window.$RefreshReg$;
                        prevRefreshSig = window.$RefreshSig$;
                        window.$RefreshReg$ = (type, refreshId) => {
                          let registerId = \`${moduleName} \${refreshId}\`;
                          window.$RefreshRuntime$.register(type, registerId);
                        };
                        window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
                      }
                    `;

                    let end = `
                      if (typeof window !== 'undefined') {
                        window.$RefreshReg$ = prevRefreshReg;
                        window.$RefreshSig$ = prevRefreshSig;
                      }
                    `;

                    return {
                      contents: `${start}\n${result.code}\n${end}`,
                      loader: "tsx",
                      resolveDir: dirname(path),
                    };
                  }
                }
              });
            },
          },
        ],
      });

      this.#metafile = results?.metafile;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        this.#error = error;
      } else {
        this.#error = new Error("Unknown error");
      }
    }
  }

  private get initializeBrowserPath() {
    let initializeBrowser = fileURLToPath(
      new URL("./clients/browser/initialize-browser.tsx", frameworkSrcDir),
    );

    return initializeBrowser;
  }

  private get srcSSRAppPath() {
    let initializeBrowser = fileURLToPath(
      new URL("./clients/browser/ssr-app.tsx", frameworkSrcDir),
    );

    return initializeBrowser;
  }

  private get metafile() {
    if (!this.#metafile) {
      throw new Error("Failed to get metafile");
    }

    return this.#metafile;
  }

  get error() {
    return this.#error;
  }

  async cleanup() {}

  get files() {
    return Object.keys(this.metafile.outputs);
  }

  get bootstrapPath() {
    let outputs = this.metafile.outputs;
    let outputFiles = Object.keys(outputs);

    let file = outputFiles.find((outputFile) => {
      let entryPoint = outputs[outputFile].entryPoint;
      if (entryPoint) {
        let fullEntryPointPath = path.join(process.cwd(), entryPoint);
        return fullEntryPointPath === this.initializeBrowserPath;
      }
    });

    if (!file) {
      throw new Error("Failed to get bootstrap module");
    }

    let filePath = fileURLToPath(new URL(file, cwdUrl));

    return filePath;
  }

  get bootstrapHash() {
    let file = path.basename(this.bootstrapPath);
    let nameWithoutExtension = file.split(".")[0] ?? file;
    let parts = nameWithoutExtension.split("-");
    let hash = parts.at(-1) ?? "";
    return hash;
  }

  get SSRAppPath() {
    let outputs = this.metafile.outputs;
    let outputFiles = Object.keys(outputs);

    let file = outputFiles.find((outputFile) => {
      let entryPoint = outputs[outputFile].entryPoint;
      if (entryPoint) {
        let fullEntryPointPath = path.join(process.cwd(), entryPoint);
        return fullEntryPointPath === this.srcSSRAppPath;
      }
    });

    if (!file) {
      throw new Error("Failed to get bootstrap module");
    }

    let filePath = fileURLToPath(new URL(file, cwdUrl));

    return filePath;
  }

  get chunks() {
    let outputs = this.metafile.outputs;
    let outputFiles = Object.keys(outputs);

    let chunkFiles = outputFiles.filter((outputFile) => {
      return /\/chunks\/chunk-[A-Z0-9]+\.js$/.test(outputFile);
    });

    return chunkFiles.map((chunkFile) => {
      let file = path.basename(chunkFile);
      let nameWithoutExtension = file.split(".")[0] ?? file;
      let parts = nameWithoutExtension.split("-");
      let hash = parts.at(-1) ?? "";
      return {
        hash,
        path: path.join(process.cwd(), chunkFile),
      };
    });
  }
}
