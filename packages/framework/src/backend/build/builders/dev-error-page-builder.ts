import { esbuildPluginTailwind } from "@ryanto/esbuild-plugin-tailwind";
import { build as esbuildBuild, type Metafile } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { appCompiledDir, cwdUrl, frameworkSrcDir } from "../../files.js";
import { LazyValue } from "../helpers/lazy-value.js";
import { Builder } from "./builder.js";

type ErrorPageAssets = {
  readonly jsPath: string;
  readonly cssPath: string;
};

let appPath = fileURLToPath(
  new URL("./client/apps/errors/app.tsx", frameworkSrcDir),
);

export class DevErrorPageBuilder extends Builder<void, DevErrorPageOutput> {
  async build() {
    let outdir = fileURLToPath(new URL("./error-app/", appCompiledDir));

    let result = await esbuildBuild({
      bundle: true,
      format: "esm",
      jsx: "automatic",
      logLevel: "error",
      entryPoints: [appPath],
      entryNames: "entries/[name]-[hash]",
      outdir,
      outbase: "src",
      splitting: true,
      chunkNames: "chunks/[name]-[hash]",
      metafile: true,
      plugins: [
        esbuildPluginTailwind({
          base: path.dirname(appPath),
        }),
      ],
    });

    return new DevErrorPageOutput(result.metafile);
  }

  load(data: ReturnType<DevErrorPageOutput["serialize"]>) {
    return new DevErrorPageOutput(data.metafile);
  }
}

export class DevErrorPageOutput {
  readonly #metafile: Metafile;
  readonly #assets: LazyValue<ErrorPageAssets>;
  readonly #js: LazyValue<Promise<string>>;
  readonly #css: LazyValue<Promise<string>>;

  constructor(metafile: Metafile) {
    this.#metafile = metafile;
    this.#assets = new LazyValue(() => this.#metafileToAssets());
    this.#js = new LazyValue(() => readFile(this.#assets.value.jsPath, "utf8"));
    this.#css = new LazyValue(() =>
      readFile(this.#assets.value.cssPath, "utf8"),
    );
  }

  js() {
    return this.#js.value;
  }

  css() {
    return this.#css.value;
  }

  serialize() {
    return {
      metafile: this.#metafile,
    };
  }

  async warm() {
    await Promise.all([this.#js.value, this.#css.value]);
  }

  #metafileToAssets() {
    let rootPath = fileURLToPath(cwdUrl);
    let outputs = this.#metafile.outputs;
    let jsPath = Object.keys(outputs).find((outputPath) => {
      let entryPoint = outputs[outputPath]?.entryPoint;
      return entryPoint && path.resolve(rootPath, entryPoint) === appPath;
    });

    if (!jsPath) {
      throw new Error("Failed to get error page JavaScript asset");
    }

    let cssPath = outputs[jsPath]?.cssBundle;

    if (!cssPath) {
      throw new Error("Failed to get error page CSS bundle");
    }

    return {
      jsPath: path.resolve(rootPath, jsPath),
      cssPath: path.resolve(rootPath, cssPath),
    };
  }
}
