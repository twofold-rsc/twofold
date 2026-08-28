import { randomBytes } from "node:crypto";
import { rm } from "fs/promises";
import { createJiti } from "jiti";
import * as z from "zod";
import type { Config } from "../../../../types/importable.js";
import { Bus } from "../../../bus.js";
import { appCompiledDir, cwdUrl } from "../../../files.js";
import type { Builder, BuilderOutput } from "../builders/builder.js";
import type {
  AssetsBuilder,
  AssetsBuilderInput,
  AssetsOutput,
} from "../builders/assets-builder.js";
import type {
  ClientBuilder,
  ClientBuilderInput,
  ClientOutput,
} from "../builders/client-builder.js";
import type {
  DevErrorPageBuilder,
  DevErrorPageOutput,
} from "../builders/dev-error-page-builder.js";
import type {
  EntriesBuilder,
  EntriesBuilderInput,
  EntriesOutput,
} from "../builders/entries-builder.js";
import type {
  RSCBuilder,
  RSCBuilderInput,
  RSCOutput,
} from "../builders/rsc-builder.js";
import type {
  ServerFilesBuilder,
  ServerFilesBuilderInput,
  ServerFilesOutput,
} from "../builders/server-files-builder.js";
import type {
  StaticFilesBuilder,
  StaticFilesBuilderInput,
  StaticFilesOutput,
} from "../builders/static-files-builder.js";
import { getBuildChanges, type BuildChanges } from "./changes.js";

let jiti = createJiti(import.meta.url, {
  debug: false,
  moduleCache: false,
});

let configSchema = z.object({
  externalPackages: z.array(z.string()).optional(),
  bundlePackages: z.array(z.string()).optional(),
  reactCompiler: z.boolean().optional(),
  trustProxy: z.boolean().optional(),
});

export type BuilderResult<Output> =
  | { readonly status: "success"; readonly output: Output }
  | { readonly status: "error"; readonly error: Error };

export type BuilderOutputs = {
  readonly entries: EntriesOutput;
  readonly devErrorPage: DevErrorPageOutput;
  readonly serverFiles: ServerFilesOutput;
  readonly staticFiles: StaticFilesOutput;
  readonly rsc: RSCOutput;
  readonly client: ClientOutput;
  readonly assets: AssetsOutput;
};

export type BuilderRegistry = {
  readonly entries?: EntriesBuilder;
  readonly devErrorPage?: DevErrorPageBuilder;
  readonly serverFiles?: ServerFilesBuilder;
  readonly staticFiles?: StaticFilesBuilder;
  readonly rsc?: RSCBuilder;
  readonly client?: ClientBuilder;
  readonly assets?: AssetsBuilder;
};

export type BuildResult<Outputs> =
  | {
      readonly key: string;
      readonly status: "success";
      readonly outputs: Outputs;
      readonly changes: BuildChanges;
      readonly duration: number;
    }
  | {
      readonly key: string;
      readonly status: "error";
      readonly error: Error;
      readonly outputs: Partial<BuilderOutputs>;
      readonly duration: number;
    };

export type SuccessfulBuildResult<Outputs> = Extract<
  BuildResult<Outputs>,
  { status: "success" }
>;

export type FailedBuildResult<Outputs> = Extract<
  BuildResult<Outputs>,
  { status: "error" }
>;

type BuildEvents<Outputs> = {
  readonly complete: BuildResult<Outputs>;
};

type BuildContext<Outputs> = {
  readonly attempt: BuildAttempt;
  readonly previous: BuildResult<Outputs> | undefined;
};

type RunArguments =
  | readonly ["entries", EntriesBuilderInput]
  | readonly ["devErrorPage"]
  | readonly ["serverFiles", ServerFilesBuilderInput]
  | readonly ["staticFiles", StaticFilesBuilderInput]
  | readonly ["rsc", RSCBuilderInput]
  | readonly ["client", ClientBuilderInput]
  | readonly ["assets", AssetsBuilderInput];

export class BuildAttempt {
  readonly #outputs: Partial<BuilderOutputs> = {};
  readonly #errors: Error[] = [];
  readonly #previousOutputs: Partial<BuilderOutputs>;
  readonly #builders: BuilderRegistry;

  constructor(
    builders: BuilderRegistry,
    previous: { readonly outputs: Partial<BuilderOutputs> } | undefined,
  ) {
    this.#builders = builders;
    this.#previousOutputs = previous?.outputs ?? {};
  }

  get outputs(): Partial<BuilderOutputs> {
    return this.#outputs;
  }

  get errors(): readonly Error[] {
    return this.#errors;
  }

  #keep<Key extends keyof BuilderOutputs>(
    key: Key,
    output: BuilderOutputs[Key],
  ): BuilderResult<BuilderOutputs[Key]> {
    this.#outputs[key] = output;
    return { status: "success", output };
  }

  keep<Key extends keyof BuilderOutputs>(
    key: Key,
  ): BuilderResult<BuilderOutputs[Key]> {
    let output = this.#previousOutputs[key];

    if (output === undefined) {
      throw new Error(`Previous build has no output for "${String(key)}"`);
    }

    return this.#keep(key, output);
  }

  async run(
    name: "entries",
    input: EntriesBuilderInput,
  ): Promise<BuilderResult<EntriesOutput>>;
  async run(name: "devErrorPage"): Promise<BuilderResult<DevErrorPageOutput>>;
  async run(
    name: "serverFiles",
    input: ServerFilesBuilderInput,
  ): Promise<BuilderResult<ServerFilesOutput>>;
  async run(
    name: "staticFiles",
    input: StaticFilesBuilderInput,
  ): Promise<BuilderResult<StaticFilesOutput>>;
  async run(
    name: "rsc",
    input: RSCBuilderInput,
  ): Promise<BuilderResult<RSCOutput>>;
  async run(
    name: "client",
    input: ClientBuilderInput,
  ): Promise<BuilderResult<ClientOutput>>;
  async run(
    name: "assets",
    input: AssetsBuilderInput,
  ): Promise<BuilderResult<AssetsOutput>>;
  async run(...args: RunArguments): Promise<BuilderResult<BuilderOutput>> {
    switch (args[0]) {
      case "entries":
        return await this.#run("entries", this.#builders.entries, args[1]);
      case "devErrorPage":
        return await this.#run(
          "devErrorPage",
          this.#builders.devErrorPage,
          undefined,
        );
      case "serverFiles":
        return await this.#run(
          "serverFiles",
          this.#builders.serverFiles,
          args[1],
        );
      case "staticFiles":
        return await this.#run(
          "staticFiles",
          this.#builders.staticFiles,
          args[1],
        );
      case "rsc":
        return await this.#run("rsc", this.#builders.rsc, args[1]);
      case "client":
        return await this.#run("client", this.#builders.client, args[1]);
      case "assets":
        return await this.#run("assets", this.#builders.assets, args[1]);
    }
  }

  async #run<Key extends keyof BuilderOutputs, Input>(
    key: Key,
    builder: Builder<Input, BuilderOutputs[Key]> | undefined,
    input: Input,
  ): Promise<BuilderResult<BuilderOutputs[Key]>> {
    try {
      if (!builder) {
        throw new Error(`Builder "${key}" is not registered`);
      }

      let output = await builder.build(input);
      return this.#keep(key, output);
    } catch (thrown) {
      let error = normalizeError(thrown);
      this.#errors.push(error);
      return { status: "error", error };
    }
  }

  async capture<Value>(
    fn: () => Value | Promise<Value>,
  ): Promise<BuilderResult<Value>> {
    try {
      return {
        status: "success",
        output: await fn(),
      };
    } catch (thrown) {
      let error = normalizeError(thrown);
      this.#errors.push(error);
      return { status: "error", error };
    }
  }

  fail(thrown: unknown) {
    this.#errors.push(normalizeError(thrown));
  }
}

export abstract class Build<
  Outputs extends {
    readonly rsc: RSCOutput;
    readonly client: ClientOutput;
  },
> {
  readonly sourceRoot = cwdUrl;

  readonly #events = new Bus<BuildEvents<Outputs>>(0);

  #appConfig?: Required<Config> | undefined;
  #lock?: Promise<BuildResult<Outputs>> | undefined;
  #result?: BuildResult<Outputs> | undefined;
  #successfulResult?: SuccessfulBuildResult<Outputs> | undefined;

  abstract build(): Promise<BuildResult<Outputs>>;

  get isBuilding() {
    return this.#lock !== undefined;
  }

  get lock() {
    return this.#lock;
  }

  get result() {
    return this.#result;
  }

  get events() {
    return this.#events;
  }

  get error() {
    return this.#result?.status === "error" ? this.#result.error : undefined;
  }

  async getAppConfig(): Promise<Required<Config>> {
    if (!this.#appConfig) {
      let appConfigContents = await this.#readAppConfig();
      let parsedConfig = configSchema.safeParse(appConfigContents);

      if (parsedConfig.error) {
        throw new Error("Invalid configuration: config/application.ts");
      }

      this.#appConfig = {
        externalPackages: parsedConfig.data.externalPackages ?? [],
        bundlePackages: parsedConfig.data.bundlePackages ?? [],
        reactCompiler: parsedConfig.data.reactCompiler ?? false,
        trustProxy: parsedConfig.data.trustProxy ?? false,
      };
    }

    return this.#appConfig;
  }

  async setup() {
    this.#appConfig = undefined;
    this.#result = undefined;
    this.#successfulResult = undefined;
    await rm(appCompiledDir, { recursive: true, force: true });
  }

  protected async createNewBuild(
    builders: BuilderRegistry,
    fn: (context: BuildContext<Outputs>) => Promise<Outputs | undefined>,
  ) {
    if (this.#lock) {
      return await this.#lock;
    }

    let build = this.#performBuild(builders, fn);
    this.#lock = build;

    try {
      return await build;
    } finally {
      if (this.#lock === build) {
        this.#lock = undefined;
      }
    }
  }

  async #performBuild(
    builders: BuilderRegistry,
    fn: (context: BuildContext<Outputs>) => Promise<Outputs | undefined>,
  ): Promise<BuildResult<Outputs>> {
    let startTime = performance.now();
    let previous = this.#result;
    let attempt = new BuildAttempt(builders, previous);
    let outputs: Outputs | undefined;

    try {
      outputs = await fn({ attempt, previous });
    } catch (thrown) {
      attempt.fail(thrown);
    }

    if (!outputs && attempt.errors.length === 0) {
      attempt.fail(new Error("Build did not produce output"));
    }

    let result: BuildResult<Outputs>;

    if (attempt.errors.length > 0) {
      let error = buildError(attempt.errors);
      result = {
        key: randomBytes(6).toString("hex"),
        status: "error",
        error,
        outputs: attempt.outputs,
        duration: performance.now() - startTime,
      };
    } else {
      if (!outputs) {
        throw new Error("Build completed without output or an error");
      }

      result = {
        key: randomBytes(6).toString("hex"),
        status: "success",
        outputs,
        changes: getBuildChanges(this.#successfulResult?.outputs, outputs),
        duration: performance.now() - startTime,
      };
    }

    this.#result = result;

    if (result.status === "success") {
      this.#successfulResult = result;
    }

    this.#events.emit("complete", result);

    return result;
  }

  async #readAppConfig() {
    let appConfigFileUrl = new URL("./config/application.ts", this.sourceRoot);
    let configModule: unknown = await jiti.import(appConfigFileUrl.href);

    if (
      configModule &&
      typeof configModule === "object" &&
      "default" in configModule
    ) {
      return configModule.default ?? {};
    }

    return {};
  }
}

function normalizeError(thrown: unknown) {
  if (thrown instanceof Error) {
    return thrown;
  }

  return new Error("Build failed", { cause: thrown });
}

function buildError(errors: readonly Error[]) {
  if (errors.length === 1) {
    return errors[0] ?? new Error("Build failed");
  }

  return new AggregateError(errors, "Build failed");
}
