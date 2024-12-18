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
import { time } from "./time.js";
import EventEmitter from "events";

let jiti = createJiti(import.meta.url, {
  debug: false,
  moduleCache: false,
});

export const configSchema = z.object({
  externalPackages: z.array(z.string()).optional(),
  bundlePackages: z.array(z.string()).optional(),
  reactCompiler: z.boolean().optional(),
  trustProxy: z.boolean().optional(),
});

type Config = z.infer<typeof configSchema>;

type Complete = {
  key: string;
  time: number;
};

class BuildEvents extends EventEmitter {}

export abstract class Build {
  abstract readonly name: "development" | "production";
  abstract readonly canReload: boolean;
  abstract build(): Promise<Complete>;

  #key = randomBytes(6).toString("hex");
  #builders: Builder[] = [];
  #appConfig?: Config;

  #lock?: Promise<Complete>;
  #hasBuilt = false;

  #events = new BuildEvents();

  async getAppConfig() {
    let defaultConfig: Required<Config> = {
      externalPackages: [],
      bundlePackages: [],
      reactCompiler: false,
      trustProxy: false,
    };

    if (!this.#appConfig) {
      let appConfigContents = await this.readAppConfig();
      let parsedConfig = configSchema.safeParse(appConfigContents);

      if (parsedConfig.error) {
        throw new Error("Invalid configuration: config/application.ts");
      }

      this.#appConfig = parsedConfig.data;
    }

    return {
      ...defaultConfig,
      ...this.#appConfig,
    };
  }

  private async readAppConfig() {
    let appConfigFileUrl = new URL("./application.ts", appConfigDir);
    let configMod: any = await jiti.import(appConfigFileUrl.href);
    return configMod.default ?? {};
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
      {},
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

  get isBuilding() {
    return !!this.#lock;
  }

  get lock() {
    return this.#lock;
  }

  get hasBuilt() {
    return this.#hasBuilt;
  }

  get key() {
    return this.#key;
  }

  get error() {
    return this.#builders.reduce<Error | null>((error, builder) => {
      return error || builder.error;
    }, null);
  }

  get events() {
    return this.#events;
  }

  async setup() {
    this.#appConfig = undefined;
    await rm(appCompiledDir, { recursive: true, force: true });
    await Promise.all(this.#builders.map((builder) => builder.setup()));
  }

  async stop() {
    await Promise.all(this.#builders.map((builder) => builder.stop()));
  }

  // this is a work in progress, not really fully complete
  async createNewBuild(fn: () => Promise<void>) {
    if (this.#lock) {
      // should we be returning a lock, or cancelling and creating
      // a new build
      let result = await this.#lock;
      return result;
    }

    let lock = createPromiseWithResolvers<Complete>();
    this.#lock = lock.promise;

    let buildTime = time("build");

    buildTime.start();
    await fn();
    buildTime.end();

    this.#key = randomBytes(6).toString("hex");
    this.#hasBuilt = true;
    this.#lock = undefined;
    this.#events.emit("complete");

    let result = {
      key: this.key,
      time: buildTime.duration,
    };

    lock.resolve(result);

    return result;
  }

  async save() {
    let data = await this.serialize();
    let json = JSON.stringify(data, null, 2);
    let jsonUrl = new URL("./build.json", appCompiledDir);
    await writeFile(jsonUrl, json, "utf-8");
  }

  private async serialize() {
    if (this.error) {
      throw new Error("Cannot serialize build with error", {
        cause: this.error,
      });
    }

    if (!this.#hasBuilt) {
      throw new Error("Cannot serialize build that has not been built");
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

    let config = await this.getAppConfig();

    return {
      key: this.key,
      name: this.name,
      config,
      builders: builderOutputs,
    };
  }

  async load() {
    let jsonUrl = new URL("./build.json", appCompiledDir);
    let json = await readFile(jsonUrl, "utf-8");
    let data = JSON.parse(json);

    // load key
    this.#key = data.key;

    // load config
    let parsedConfig = configSchema.safeParse(data.config);
    if (parsedConfig.error) {
      throw new Error(
        "Invalid configuration. This is most likely a bug in Twofold.",
      );
    }
    this.#appConfig = parsedConfig.data;

    // load builders
    let builderKeys = Object.keys(data.builders);
    builderKeys.forEach((key) => {
      let name = data.builders[key].name;
      this.getBuilder(name).load(data.builders[key]);
    });

    // mark as built
    this.#hasBuilt = true;
  }
}

function createPromiseWithResolvers<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  let promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
