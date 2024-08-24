import { randomBytes } from "crypto";
import { Builder } from "./builders/base-builder";
import { appCompiledDir } from "../files.js";
import { readFile, rm, writeFile } from "fs/promises";
import { EntriesBuilder } from "./builders/entries-builder";
import { StaticFilesBuilder } from "./builders/static-files-builder";
import { ServerFilesBuilder } from "./builders/server-files-builder";
import { RSCBuilder } from "./builders/rsc-builder";
import { ClientAppBuilder } from "./builders/client-app-builder";
import { DevErrorPageBuilder } from "./builders/dev-error-page-builder";
import { ConfigBuilder } from "./builders/config-builder";

export abstract class Build {
  abstract env: "development" | "production";
  abstract build(): Promise<void>;

  #key = randomBytes(6).toString("hex");
  #builders: Builder[] = [];

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
      {},
    );
  }

  getBuilder(name: "entries"): EntriesBuilder;
  getBuilder(name: "dev-error-page"): DevErrorPageBuilder;
  getBuilder(name: "rsc"): RSCBuilder;
  getBuilder(name: "client"): ClientAppBuilder;
  getBuilder(name: "static-files"): StaticFilesBuilder;
  getBuilder(name: "server-files"): ServerFilesBuilder;
  getBuilder(name: "config"): ConfigBuilder;
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
      {},
    );

    return {
      key: this.key,
      env: this.env,
      builders: builderOutputs,
    };
  }

  async save() {
    let data = this.serialize();
    let json = JSON.stringify(data, null, 2);
    let buildJsonUrl = new URL("./build.json", appCompiledDir);
    await writeFile(buildJsonUrl, json, "utf-8");
  }

  async load() {
    let buildJsonUrl = new URL("./build.json", appCompiledDir);
    let json = await readFile(buildJsonUrl, "utf-8");
    let buildData = JSON.parse(json);

    let builderKeys = Object.keys(buildData.builders);
    builderKeys.forEach((key) => {
      let name = buildData.builders[key].name;
      this.getBuilder(name).load(buildData.builders[key]);
    });
  }
}
