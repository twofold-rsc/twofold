import { randomBytes } from "node:crypto";
import { readFile, rm, writeFile } from "fs/promises";
import { createJiti } from "jiti";
import * as z from "zod";
import type { Config } from "../../../types/importable.js";
import { Bus } from "../../bus.js";
import { appCompiledDir, cwdUrl } from "../../files.js";
import type { Builder, BuilderOutput } from "../builders/builder.js";
import type { AssetsBuilder } from "../builders/assets-builder.js";
import type { ClientBuilder } from "../builders/client-builder.js";
import type { DevErrorPageBuilder } from "../builders/dev-error-page-builder.js";
import type { EntriesBuilder } from "../builders/entries-builder.js";
import type { RSCBuilder } from "../builders/rsc-builder.js";
import type { ServerFilesBuilder } from "../builders/server-files-builder.js";
import type { StaticFilesBuilder } from "../builders/static-files-builder.js";
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

export type BuilderRegistry = {
  readonly entries: EntriesBuilder;
  readonly devErrorPage: DevErrorPageBuilder;
  readonly serverFiles: ServerFilesBuilder;
  readonly staticFiles: StaticFilesBuilder;
  readonly rsc: RSCBuilder;
  readonly client: ClientBuilder;
  readonly assets: AssetsBuilder;
};

type OutputsFor<Registry> = {
  readonly [Name in keyof Registry]: Registry[Name] extends Builder<
    infer _Input,
    infer Output
  >
    ? Output
    : never;
};

export type BuilderOutputs = OutputsFor<BuilderRegistry>;

export type BuilderRegistryByKind = {
  development: BuilderRegistry;
  production: Omit<BuilderRegistry, "devErrorPage">;
};

export type BuildKind = keyof BuilderOutputsByKind;

export type BuilderOutputsByKind = {
  readonly [Kind in keyof BuilderRegistryByKind]: OutputsFor<
    BuilderRegistryByKind[Kind]
  >;
};

type BuilderArguments<
  Kind extends BuildKind,
  Name extends keyof BuilderRegistryByKind[Kind],
> = BuilderRegistryByKind[Kind][Name] extends {
  build(...args: infer Arguments): unknown;
}
  ? Arguments
  : never;

type BuilderResult<Output> =
  | { readonly status: "success"; readonly output: Output }
  | { readonly status: "error"; readonly error: Error };

type BuildShared<Kind extends BuildKind> = {
  readonly key: string;
  readonly kind: Kind;
  readonly duration: number;
};

type BuildSuccessOptions<Kind extends BuildKind> = BuildShared<Kind> & {
  readonly config: Required<Config>;
  readonly outputs: BuilderOutputsByKind[Kind];
  readonly changes: BuildChanges;
};

export class BuildSuccess<Kind extends BuildKind = BuildKind> {
  readonly status = "success";
  readonly key: string;
  readonly kind: Kind;
  readonly duration: number;
  readonly config: Required<Config>;
  readonly outputs: BuilderOutputsByKind[Kind];
  readonly changes: BuildChanges;

  constructor({
    key,
    kind,
    duration,
    config,
    outputs,
    changes,
  }: BuildSuccessOptions<Kind>) {
    this.key = key;
    this.kind = kind;
    this.duration = duration;
    this.config = config;
    this.outputs = outputs;
    this.changes = changes;
  }

  async save() {
    let outputs = Object.fromEntries(
      Object.entries(this.outputs).map(([name, output]) => [
        name,
        output.serialize(),
      ]),
    );

    let data: SerializedBuild = {
      version: 2,
      kind: this.kind,
      key: this.key,
      config: this.config,
      outputs,
    };

    let jsonUrl = new URL("./build.json", appCompiledDir);

    await writeFile(jsonUrl, JSON.stringify(data, null, 2), "utf-8");
  }

  async warm() {
    await Promise.all(
      Object.values(this.outputs).map((output) =>
        Promise.resolve(output.warm()),
      ),
    );
  }
}

export type BuildSuccessByKind = {
  readonly [Kind in BuildKind]: BuildSuccess<Kind>;
};

export type BuildFailure<Kind extends BuildKind = BuildKind> = {
  [K in Kind]: BuildShared<K> & {
    readonly status: "error";
    readonly error: Error;
    readonly outputs: Partial<BuilderOutputsByKind[K]>;
  };
}[Kind];

export type BuildResult<Kind extends BuildKind = BuildKind> = {
  [K in Kind]: BuildSuccess<K> | BuildFailure<K>;
}[Kind];

type BuildEvents<Kind extends BuildKind> = {
  readonly complete: BuildResult<Kind>;
};

type SerializedBuild = {
  readonly version: 2;
  readonly kind: BuildKind;
  readonly key: string;
  readonly config: Required<Config>;
  readonly outputs: Record<string, unknown>;
};

type BuildContext<Kind extends BuildKind> = {
  readonly attempt: BuildAttempt<Kind>;
  readonly previous: BuildResult<Kind> | undefined;
  readonly config: Required<Config>;
};

export class BuildAttempt<Kind extends BuildKind> {
  readonly #outputs: Partial<BuilderOutputsByKind[Kind]> = {};
  readonly #errors: Error[] = [];
  readonly #previousOutputs: Partial<BuilderOutputsByKind[Kind]>;
  readonly #builders: BuilderRegistryByKind[Kind];

  constructor(
    builders: BuilderRegistryByKind[Kind],
    previous:
      { readonly outputs: Partial<BuilderOutputsByKind[Kind]> } | undefined,
  ) {
    this.#builders = builders;
    this.#previousOutputs = previous?.outputs ?? {};
  }

  get outputs() {
    return this.#outputs;
  }

  get errors(): readonly Error[] {
    return this.#errors;
  }

  #keep<Name extends keyof BuilderOutputsByKind[Kind]>(
    name: Name,
    output: BuilderOutputsByKind[Kind][Name],
  ): BuilderResult<BuilderOutputsByKind[Kind][Name]> {
    this.#outputs[name] = output;
    return { status: "success", output };
  }

  keep<Name extends keyof BuilderRegistryByKind[Kind]>(name: Name) {
    let output = this.#previousOutputs[name];

    if (output === undefined) {
      throw new Error(`Previous build has no output for "${String(name)}"`);
    }

    return this.#keep(name, output);
  }

  async run<Name extends keyof BuilderRegistryByKind[Kind]>(
    name: Name,
    ...args: BuilderArguments<Kind, Name>
  ): Promise<BuilderResult<BuilderOutputsByKind[Kind][Name]>> {
    // need this as because builder gets lost. would love to fix,
    // but dont know how
    let builder = this.#builders[name] as {
      build(
        ...args: BuilderArguments<Kind, Name>
      ): Promise<BuilderOutputsByKind[Kind][Name]>;
    };

    try {
      let output = await builder.build(...args);
      return this.#keep(name, output);
    } catch (thrown) {
      let error = normalizeError(thrown);
      this.#errors.push(error);

      return {
        status: "error",
        error,
      };
    }
  }

  fail(thrown: unknown) {
    this.#errors.push(normalizeError(thrown));
  }
}

export abstract class BuildSession<Kind extends BuildKind> {
  readonly sourceRoot = cwdUrl;
  readonly kind: Kind;

  readonly #events = new Bus<BuildEvents<Kind>>(0);
  readonly #builders: BuilderRegistryByKind[Kind];

  #appConfig?: Required<Config> | undefined;
  #lock?: Promise<BuildResult<Kind>> | undefined;
  #latestResult?: BuildResult<Kind> | undefined;
  #latestSuccessfulResult?: BuildSuccess<Kind> | undefined;

  protected constructor(kind: Kind, builders: BuilderRegistryByKind[Kind]) {
    this.kind = kind;
    this.#builders = builders;
  }

  abstract build(): Promise<BuildResult<Kind>>;

  get isBuilding() {
    return this.#lock !== undefined;
  }

  get lock() {
    return this.#lock;
  }

  get events() {
    return this.#events;
  }

  async getAppConfig(): Promise<Required<Config>> {
    if (!this.#appConfig) {
      let appConfigContents = await this.#readAppConfig();
      let parsedConfig = configSchema.safeParse(appConfigContents);

      if (parsedConfig.error) {
        throw new Error("Invalid configuration: config/application.ts");
      }

      this.#appConfig = normalizeConfig(parsedConfig.data);
    }

    return this.#appConfig;
  }

  async setup() {
    this.#appConfig = undefined;
    this.#latestResult = undefined;
    this.#latestSuccessfulResult = undefined;
    await rm(appCompiledDir, { recursive: true, force: true });
  }

  async load(): Promise<BuildSuccess<Kind>> {
    let startTime = performance.now();
    let jsonUrl = new URL("./build.json", appCompiledDir);
    let json = await readFile(jsonUrl, "utf-8");
    let data: SerializedBuild = JSON.parse(json);

    if (data.version !== 2) {
      throw new Error(`Unsupported build version: ${String(data.version)}`);
    }

    if (data.kind !== this.kind) {
      throw new Error(`Cannot load ${data.kind} build as ${this.kind} build`);
    }

    let parsedConfig = configSchema.safeParse(data.config);

    if (parsedConfig.error) {
      throw new Error("Invalid configuration in build artifact");
    }

    let config = normalizeConfig(parsedConfig.data);
    this.#appConfig = config;

    let outputs: Record<string, BuilderOutput> = {};

    for (let [name, builder] of Object.entries(this.#builders)) {
      if (builder) {
        // hacky, we need some sort of validation/parsing here because
        // we are just ripping the build json in here. this is clearly
        // a boundary that needs parsing
        outputs[name] = builder.load(data.outputs[name] as never);
      }
    }

    // shitty boundary hack. would love to parse this but not sure how
    let loadedOutputs = outputs as BuilderOutputsByKind[Kind];

    let result = new BuildSuccess({
      kind: this.kind,
      key: data.key,
      config,
      outputs: loadedOutputs,
      changes: getBuildChanges(undefined, loadedOutputs),
      duration: performance.now() - startTime,
    });

    this.#latestResult = result;
    this.#latestSuccessfulResult = result;

    return result;
  }

  protected async createNewBuild(
    fn: (
      context: BuildContext<Kind>,
    ) => Promise<BuilderOutputsByKind[Kind] | undefined>,
  ) {
    if (this.#lock) {
      return await this.#lock;
    }

    let buildPromise = this.#performBuild(fn);
    this.#lock = buildPromise;

    try {
      return await buildPromise;
    } finally {
      if (this.#lock === buildPromise) {
        this.#lock = undefined;
      }
    }
  }

  async #performBuild(
    fn: (
      context: BuildContext<Kind>,
    ) => Promise<BuilderOutputsByKind[Kind] | undefined>,
  ): Promise<BuildResult<Kind>> {
    let startTime = performance.now();
    let previous = this.#latestResult;
    let attempt = new BuildAttempt(this.#builders, previous);
    let config: Required<Config> | undefined;
    let outputs: BuilderOutputsByKind[Kind] | undefined;

    try {
      config = await this.getAppConfig();
      outputs = await fn({ attempt, previous, config });
    } catch (thrown) {
      attempt.fail(thrown);
    }

    if ((!config || !outputs) && attempt.errors.length === 0) {
      attempt.fail(new Error("Build did not produce output"));
    }

    let result: BuildResult<Kind>;

    if (attempt.errors.length > 0) {
      let error = buildError(attempt.errors);
      result = {
        kind: this.kind,
        key: randomBytes(6).toString("hex"),
        status: "error",
        error,
        outputs: attempt.outputs,
        duration: performance.now() - startTime,
      };
    } else {
      // not really passive, invariant
      if (!config || !outputs) {
        throw new Error("Build completed without config, output, or an error");
      }

      result = new BuildSuccess({
        kind: this.kind,
        key: randomBytes(6).toString("hex"),
        config,
        outputs,
        changes: getBuildChanges(
          this.#latestSuccessfulResult?.outputs,
          outputs,
        ),
        duration: performance.now() - startTime,
      });
    }

    this.#latestResult = result;

    if (result.status === "success") {
      this.#latestSuccessfulResult = result;
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

function normalizeConfig(
  config: z.infer<typeof configSchema>,
): Required<Config> {
  return {
    externalPackages: config.externalPackages ?? [],
    bundlePackages: config.bundlePackages ?? [],
    reactCompiler: config.reactCompiler ?? false,
    trustProxy: config.trustProxy ?? false,
  };
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
