import "./monkey-patch.js";
import { MessageChannel, Worker } from "node:worker_threads";
import { PageRequest } from "./runtime/page-request.js";
import { APIRequest } from "./runtime/api-request.js";
import {
  renderToReadableStream,
  // @ts-expect-error: TypeScript cannot find type declarations for this module
} from "react-server-dom-webpack/server.edge";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./runtime/helpers/errors.js";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { deserializeError } from "serialize-error";
import { ProductionBuild } from "./build/build/production.js";
import { DevelopmentBuild } from "./build/build/development.js";
import { ActionRequest } from "./runtime/action-request.js";
import { injectResolver } from "./monkey-patch.js";
import { partition } from "./utils/partition.js";
import { pathMatches } from "./runtime/helpers/routing.js";
import { pathToFileURL } from "node:url";

type Build = DevelopmentBuild | ProductionBuild;

export class Runtime {
  #build: Build;
  #ssrWorker?: Worker | undefined;

  constructor(build: Build) {
    this.#build = build;
  }

  get build() {
    return this.#build;
  }

  // api endpoints

  apiRequest(request: Request) {
    let url = new URL(request.url);
    let realPath = url.pathname;
    let apiEndpoints = this.build.getBuilder("rsc").apiEndpoints;

    let [staticAndDynamicApis, catchAllApis] = partition(
      apiEndpoints,
      (api) => !api.isCatchAll,
    );
    let [dynamicApis, staticApis] = partition(
      staticAndDynamicApis,
      (api) => api.isDynamic,
    );

    let dynamicApisInOrder = dynamicApis.toSorted(
      (a, b) => a.dynamicSegments.length - b.dynamicSegments.length,
    );

    let api =
      staticApis.find((api) => pathMatches(api.path, realPath)) ??
      dynamicApisInOrder.find((api) => pathMatches(api.path, realPath)) ??
      catchAllApis.find((api) => pathMatches(api.path, realPath));

    if (api) {
      return new APIRequest({ api, request, runtime: this });
    }
  }

  // routing

  // build output, i hate that this is here. need to fix.
  async catchBoundaryModule() {
    let catchBoundaryPath = this.build.getBuilder("rsc").catchBoundaryPath;

    let catchBoundaryUrl = pathToFileURL(catchBoundaryPath);
    let mod = await import(catchBoundaryUrl.href);
    if (!mod.default) {
      throw new Error(
        `Catch boundary module at ${catchBoundaryPath} has no default export.`,
      );
    }

    return mod;
  }

  // pages

  pageRequest(request: Request) {
    let url = new URL(request.url);
    let page = this.build.getBuilder("rsc").tree.findPageForPath(url.pathname);

    let pageRequest = page
      ? new PageRequest({ page, request, runtime: this })
      : this.notFoundPageRequest(request);

    return pageRequest;
  }

  notFoundPageRequest(request: Request) {
    return new PageRequest({
      page: this.build.getBuilder("rsc").notFoundPage,
      request,
      runtime: this,
      conditions: ["not-found"],
    });
  }

  // actions

  actionRequest(request: Request) {
    let serverActionMap = this.build.getBuilder("rsc").serverActionMap;
    let serverManifest = this.build.getBuilder("rsc").serverManifest;

    return ActionRequest.isActionRequest(request)
      ? new ActionRequest({
          request,
          serverManifest,
          serverActionMap,
          runtime: this,
        })
      : null;
  }

  // renders

  async renderRSCStream(
    data: any,
    options: { temporaryReferences?: unknown } = {},
  ) {
    let clientComponentMap = this.build.getBuilder("client").clientComponentMap;
    let streamError: unknown;

    let rscStream = renderToReadableStream(data, clientComponentMap, {
      temporaryReferences: options.temporaryReferences,
      onError(err: unknown) {
        streamError = err;
        if (
          (isNotFoundError(err) || isRedirectError(err)) &&
          err instanceof Error &&
          "digest" in err &&
          typeof err.digest === "string"
        ) {
          return err.digest;
        } else if (err instanceof Error) {
          let digest =
            process.env.NODE_ENV === "production" ? randomUUID() : undefined;

          if (digest) {
            console.log(`Error digest: ${digest}`);
          }

          console.error(err);
          return digest;
        }
      },
    });

    // await the first chunk
    // todo: use transform stream to buffer
    // the idea is we don't want to return the stream too early, in case it
    // errors. so we'll wait for the first chunk to see if it contains
    // an error before continuing. there's probably a better way to do this.
    let [t1, t2] = rscStream.tee();
    let reader = t1.getReader();
    await reader.read();
    reader.releaseLock();
    t1.cancel();

    if (isNotFoundError(streamError)) {
      return {
        stream: t2,
        notFound: true,
      };
    } else if (isRedirectError(streamError)) {
      let { status, url } = redirectErrorInfo(streamError);
      return {
        stream: t2,
        redirect: {
          status,
          url,
        },
      };
    }

    return {
      stream: t2,
      error: streamError,
    };
  }

  async renderHtmlStreamFromRSCStream(
    rscStream: ReadableStream<Uint8Array>,
    mode: "page",
    data: Record<string, any> = {},
  ) {
    let { port1, port2 } = new MessageChannel();

    if (!this.#ssrWorker) {
      throw new Error("Worker not available");
    }

    let transformStream = new TransformStream<Uint8Array, Uint8Array>();
    let writeStream = transformStream.writable;
    let readStream = transformStream.readable;

    let getMessage = new Promise<Record<string, any>>((resolve) => {
      let handle = function (msg: Record<string, any>) {
        resolve(msg);
        port1.off("message", handle);
        port1.close();
      };
      port1.on("message", handle);
    });

    this.#ssrWorker.postMessage(
      {
        mode,
        data,
        port: port2,
        rscStream,
        writeStream,
      },
      // @ts-expect-error: Type 'ReadableStream<Uint8Array>' is not assignable to type 'TransferListItem'.
      [port2, rscStream, writeStream],
    );

    let message = await getMessage;

    if (message.status === "OK") {
      return { stream: readStream };
    } else if (message.status === "ERROR") {
      // TODO: review this
      let error = deserializeError(message.serializedError);

      if (isNotFoundError(error)) {
        return {
          stream: readStream,
          notFound: true,
        };
      } else if (isRedirectError(error)) {
        let { status, url } = redirectErrorInfo(error);
        return {
          stream: readStream,
          redirect: {
            status,
            url,
          },
        };
      } else {
        // TODO:
        // recreate the stream in error mode  (if we arent already in error mode)
        // if we are in error mode and we error again then we should throw
        // we dont want to throw, we want to render the client app
        throw error;
      }
    } else {
      throw new Error("SSR worker failed to render");
    }
  }

  // workers

  async start() {
    // actions might try to load modules
    injectResolver((moduleId) => {
      let module =
        this.#build.getBuilder("rsc").serverActionModuleMap[moduleId];

      if (!module) {
        throw new Error(`Failed to resolve module id ${moduleId}`);
      }
      return module.path;
    });
    await this.createSSRWorker();
  }

  async stop() {
    if (this.#ssrWorker) {
      await this.#ssrWorker.terminate();
      this.#ssrWorker = undefined;
    }
  }

  get hasSSRWorker() {
    return !!this.#ssrWorker;
  }

  private async createSSRWorker() {
    if (!this.build.error) {
      let bootstrapPath = this.build.getBuilder("client").bootstrapPath;
      let bootstrapFile = path.basename(bootstrapPath);
      let bootstrapUrl = `/__tf/assets/entries/${bootstrapFile}`;
      let workerUrl = new URL("./ssr/worker.js", import.meta.url);

      this.#ssrWorker = new Worker(workerUrl, {
        workerData: {
          bootstrapUrl,
          appPath: this.build.getBuilder("client").SSRAppPath,
          clientComponentModuleMap:
            this.build.getBuilder("client").clientComponentModuleMap,
        },
        execArgv: ["-C", "default"],
        env: {
          NODE_OPTIONS: "",
          NODE_ENV: this.build.name,
        },
      });
    }
  }
}
