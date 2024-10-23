import { BuildContext, Metafile, context } from "esbuild";
import * as path from "path";
import { fileURLToPath } from "url";
import { cwdUrl, frameworkSrcDir } from "../../files.js";
import { postcssTailwind } from "../plugins/postcss-tailwind.js";
import { readFile } from "fs/promises";
import { Builder } from "./builder.js";

export class DevErrorPageBuilder extends Builder {
  readonly name = "dev-error-page";

  #metafile?: Metafile;
  #context?: BuildContext;
  #rebuild = false;

  async setup() {
    this.#context = await context({
      bundle: true,
      format: "esm",
      jsx: "automatic",
      logLevel: "error",
      entryPoints: [this.appPath],
      entryNames: "entries/[name]-[hash]",
      outdir: "./.twofold/error-app/",
      outbase: "src",
      splitting: true,
      chunkNames: "chunks/[name]-[hash]",
      metafile: true,
      plugins: [postcssTailwind()],
    });
  }

  async build() {
    let shouldBuild = this.#rebuild || !this.#metafile;

    if (shouldBuild) {
      this.#metafile = undefined;
      let results = await this.#context?.rebuild();
      this.#metafile = results?.metafile;
    }
  }

  async stop() {
    await this.#context?.dispose();
  }

  serialize() {
    return {
      metafile: this.#metafile,
    };
  }

  load(data: any) {
    this.#metafile = data.metafile;
  }

  private get appPath() {
    let appPath = fileURLToPath(
      new URL("./apps/errors/app.tsx", frameworkSrcDir)
    );
    return appPath;
  }

  private get metafile() {
    if (!this.#metafile) {
      throw new Error("Failed to get metafile");
    }

    return this.#metafile;
  }

  async cleanup() {}

  private get appBootstrap() {
    let outputs = this.metafile.outputs;
    let outputFiles = Object.keys(outputs);

    let file = outputFiles.find((outputFile) => {
      let entryPoint = outputs[outputFile].entryPoint;
      if (entryPoint) {
        let fullEntryPointPath = path.join(process.cwd(), entryPoint);
        return fullEntryPointPath === this.appPath;
      }
    });

    if (!file) {
      throw new Error("Failed to get bootstrap module");
    }

    let cssFile = outputs[file].cssBundle;

    if (!cssFile) {
      throw new Error("Failed to get css bundle");
    }

    let jsPath = fileURLToPath(new URL(file, cwdUrl));
    let cssPath = fileURLToPath(new URL(cssFile, cwdUrl));

    return {
      jsPath,
      cssPath,
    };
  }

  async js() {
    let contents = await readFile(this.appBootstrap.jsPath, "utf8");
    return contents;
  }

  async css() {
    let contents = await readFile(this.appBootstrap.cssPath, "utf8");
    return contents;
  }
}
