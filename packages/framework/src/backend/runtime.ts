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
  isUnauthorizedError,
  redirectErrorInfo,
} from "./runtime/helpers/errors.js";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { deserializeError, ErrorObject } from "serialize-error";
import { ProductionBuild } from "./build/build/production.js";
import { DevelopmentBuild } from "./build/build/development.js";
import { ActionRequest } from "./runtime/action-request.js";
import { injectResolver } from "./monkey-patch.js";
import { partition } from "./utils/partition.js";
import { pathMatches } from "./runtime/helpers/routing.js";
import { invariant } from "./utils/invariant.js";
import { readStream } from "./steams/process-stream.js";

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

  // pages

  pageRequest(request: Request) {
    let url = new URL(request.url);
    let page = this.build.getBuilder("rsc").findPageForPath(url.pathname);

    let pageRequest = page
      ? new PageRequest({ page, request, runtime: this })
      : this.notFoundPageRequest(request);

    return pageRequest;
  }

  notFoundPageRequest(request: Request) {
    let page = this.build
      .getBuilder("rsc")
      .findPageForPath("/__tf/errors/not-found");

    invariant(page, "Could not find not-found page");

    return new PageRequest({
      page,
      request,
      runtime: this,
      conditions: ["not-found"],
    });
  }

  unauthorizedPageRequest(request: Request) {
    let page = this.build
      .getBuilder("rsc")
      .findPageForPath("/__tf/errors/unauthorized");

    invariant(page, "Could not find unauthorized page");

    return new PageRequest({
      page,
      request,
      runtime: this,
      conditions: ["unauthorized"],
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

        let isSafeError =
          isNotFoundError(err) ||
          isRedirectError(err) ||
          isUnauthorizedError(err);

        if (
          isSafeError &&
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
    // this is not really needed, its debt
    //
    // instead we should return the rsc stream and handle the
    // errors via the ssr layer.
    //
    // ill clean this up one day
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
    } else if (isUnauthorizedError(streamError)) {
      return {
        stream: t2,
        unauthorized: true,
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
    if (!this.#ssrWorker) {
      throw new Error("Worker not available");
    }

    let { port1, port2 } = new MessageChannel();

    let controller: ReadableStreamDefaultController<Uint8Array>;
    let htmlStream = new ReadableStream<Uint8Array>({
      start(streamController) {
        controller = streamController;
      },
    });

    let waitForStatus = Promise.withResolvers<void>();

    function handler(data: unknown) {
      if (
        data &&
        typeof data === "object" &&
        "status" in data &&
        typeof data.status === "string"
      ) {
        if (data.status === "OK") {
          waitForStatus.resolve();
        } else if (data.status === "ERROR" && "serializedError" in data) {
          waitForStatus.reject(data.serializedError);
        } else if (data.status === "DONE") {
          controller.close();
          port1.off("message", handler);
          port1.close();
        } else {
          throw new Error("Invalid message from worker");
        }
      } else if (data instanceof Uint8Array) {
        controller.enqueue(data);
      } else {
        throw new Error("Invalid message from ssr worker");
      }
    }

    port1.on("message", handler);

    this.#ssrWorker.postMessage(
      {
        mode,
        data,
        port: port2,
      },
      [port2],
    );

    readStream(rscStream, {
      onRead(value) {
        // @ts-expect-error need to debug this
        port1.postMessage(value, [value.buffer]);
      },
      onDone() {
        port1.postMessage({ status: "DONE" });
      },
    });

    try {
      await waitForStatus.promise;
    } catch (e: unknown) {
      // this is likely a worst case scenario since errors should be handled by the
      // worker. so if we get here something is really off.
      let error = deserializeError(e);

      // bubble this out and let the caller handle it
      throw error;
    }

    return { stream: htmlStream };
  }

  // workers

  async start() {
    // actions might try to load modules
    // there really needs to be an rsc worker
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
