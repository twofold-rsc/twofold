import { BuildContext, context, Metafile } from "esbuild";
import { Builder } from "./base-builder.js";
import { cwdUrl } from "../../files.js";
import { fileURLToPath, pathToFileURL } from "url";
import { getCompiledEntrypoint } from "../helpers/compiled-entrypoint.js";
import { url } from "inspector";

export class ConfigBuilder extends Builder {
  readonly name = "config";

  #env: "development" | "production";

  #metafile?: Metafile;
  #context?: BuildContext;

  constructor({ env }: { env: "development" | "production" }) {
    super();
    this.#env = env;
  }

  async setup() {
    this.#context = await context({
      bundle: true,
      format: "esm",
      logLevel: "error",
      entryPoints: ["./config/application.ts"],
      entryNames: "entries/[name]-[hash]",
      outdir: "./.twofold/config/",
      outbase: "src",
      packages: "external",
      platform: "node",
      metafile: true,
    });
  }

  async build() {
    this.#metafile = undefined;
    this.clearError();

    try {
      let results = await this.#context?.rebuild();
      this.#metafile = results?.metafile;
    } catch (error) {
      console.error(error);
      this.reportError(error);
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

  private get metafile() {
    if (!this.#metafile) {
      throw new Error("Failed to get metafile");
    }

    return this.#metafile;
  }

  async loadAppConfig() {
    let path = getCompiledEntrypoint(this.appConfigPath, this.metafile);
    let pathUrl = pathToFileURL(path);
    let mod = await import(pathUrl.href);
    return mod.default;
  }

  private get appConfigPath() {
    let appConfigFile = fileURLToPath(
      new URL("./config/application.ts", cwdUrl),
    );

    return appConfigFile;
  }
}
