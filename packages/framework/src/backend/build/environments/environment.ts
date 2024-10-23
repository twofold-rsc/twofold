import { randomBytes } from "crypto";
import { Builder } from "../builders/builder";
import { appCompiledDir, appConfigDir } from "../../files.js";
import { readFile, rm, writeFile } from "fs/promises";
import { EntriesBuilder } from "../builders/entries-builder";
import { StaticFilesBuilder } from "../builders/static-files-builder";
import { ServerFilesBuilder } from "../builders/server-files-builder";
import { RSCBuilder } from "../builders/rsc-builder";
import { ClientAppBuilder } from "../builders/client-app-builder";
import { DevErrorPageBuilder } from "../builders/dev-error-page-builder";
import { z } from "zod";
import { createJiti } from "jiti";

let jiti = createJiti(import.meta.url, {
  debug: false,
  moduleCache: false,
});

export const configSchema = z.object({
  externalPackages: z.array(z.string()).optional(),
  reactCompiler: z.boolean().optional(),
});

export abstract class Environment {
  abstract name: "development" | "production";
  abstract build(): Promise<void>;

  #key = randomBytes(6).toString("hex");
  #builders: Builder[] = [];

  async getAppConfig() {
    let defaultConfig: Required<z.infer<typeof configSchema>> = {
      externalPackages: [],
      reactCompiler: false,
    };

    let appConfigFileUrl = new URL("./application.ts", appConfigDir);
    let configMod: any = await jiti.import(appConfigFileUrl.href);
    let appConfig = configMod.default ?? {};

    let { data, error } = configSchema.safeParse(appConfig);

    if (error) {
      throw new Error("Invalid configuration: config/application.ts");
    }

    return {
      ...defaultConfig,
      ...data,
    };
  }

  addBuilder(builder: Builder) {
    this.#builders.push(builder);
  }

  get builders() {
    return this.#builders.reduce<Record<string, Builder>>(
      (builders, builder) => {
        return {
          ...builders,
          [builder.name]: builder,
        };
      },
      {}
    );
  }

  getBuilder(name: "entries"): EntriesBuilder;
  getBuilder(name: "dev-error-page"): DevErrorPageBuilder;
  getBuilder(name: "rsc"): RSCBuilder;
  getBuilder(name: "client"): ClientAppBuilder;
  getBuilder(name: "static-files"): StaticFilesBuilder;
  getBuilder(name: "server-files"): ServerFilesBuilder;
  getBuilder(name: string): never;
  getBuilder(name: string) {
    if (!this.builders[name]) {
      throw new Error(`Builder ${name} not found`);
    }

    return this.builders[name];
  }

  generateKey() {
    this.#key = randomBytes(6).toString("hex");
  }

  get key() {
    return this.#key;
  }

  get error() {
    return this.#builders.reduce<Error | null>((error, builder) => {
      return error || builder.error;
    }, null);
  }

  async setup() {
    await rm(appCompiledDir, { recursive: true, force: true });
    await Promise.all(this.#builders.map((builder) => builder.setup()));
  }

  async stop() {
    await Promise.all(this.#builders.map((builder) => builder.stop()));
  }

  serialize() {
    if (this.error) {
      throw new Error("Cannot serialize build with error", {
        cause: this.error,
      });
    }

    let builders = this.builders;
    let builderKeys = Object.keys(builders);
    let builderOutputs = builderKeys.reduce<Record<string, any>>(
      (outputs, key) => {
        outputs[key] = {
          name: builders[key].name,
          ...builders[key].serialize(),
        };
        return outputs;
      },
      {}
    );

    return {
      key: this.key,
      name: this.name,
      builders: builderOutputs,
    };
  }

  async save() {
    let data = this.serialize();
    let json = JSON.stringify(data, null, 2);
    let jsonUrl = new URL("./environment.json", appCompiledDir);
    await writeFile(jsonUrl, json, "utf-8");
  }

  async load() {
    let jsonUrl = new URL("./environment.json", appCompiledDir);
    let json = await readFile(jsonUrl, "utf-8");
    let data = JSON.parse(json);

    let builderKeys = Object.keys(data.builders);
    builderKeys.forEach((key) => {
      let name = data.builders[key].name;
      this.getBuilder(name).load(data.builders[key]);
    });
  }
}
