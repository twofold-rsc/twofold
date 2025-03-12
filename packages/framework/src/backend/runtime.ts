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
import { deserializeError } from "serialize-error";
import { ProductionBuild } from "./build/build/production.js";
import { DevelopmentBuild } from "./build/build/development.js";
import { ActionRequest } from "./runtime/action-request.js";

type Build = DevelopmentBuild | ProductionBuild;

export class Runtime {
  #hostname = "0.0.0.0";
  #port = 3000;
  #build: Build;
  #ssrWorker?: Worker;

  constructor(build: Build) {
    this.#build = build;
  }

  get build() {
    return this.#build;
  }

  get clientComponentMap() {
    return this.build.getBuilder("client").clientComponentMap;
  }

  get baseUrl() {
    let domain = this.hostname === "0.0.0.0" ? "localhost" : this.hostname;
    return `http://${domain}:${this.port}`;
  }

  get hostname() {
    return this.#hostname;
  }

  get port() {
    return this.#port;
  }

  // api endpoints

  apiRequest(request: Request) {
    let url = new URL(request.url);

    let api = this.build
      .getBuilder("rsc")
      .apiEndpoints.find((api) => api.pattern.test(url.pathname, this.baseUrl));

    if (api) {
      return new APIRequest({ api, request, runtime: this });
    }
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
    let url = new URL(request.url);
    let pattern = new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: "/__rsc/action/:id",
    });

    let exec = pattern.exec(url);
    let urlId = exec?.pathname.groups.id;

    if (!urlId) {
      throw new Error("No server action specified");
    }

    let id = decodeURIComponent(urlId);

    let serverActionMap = this.build.getBuilder("rsc").serverActionMap;
    let action = serverActionMap.get(id);

    if (!action) {
      throw new Error("Invalid action id");
    }

    let actionRequest = new ActionRequest({
      action,
      request,
      runtime: this,
    });

    return actionRequest;
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
    method: "stream" | "page" | "static",
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
        method,
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
        throw error;
      }
    } else {
      throw new Error("SSR worker failed to render");
    }
  }

  // workers

  async start() {
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
      let bootstrapUrl = `/_assets/client-app/bootstrap/${
        this.build.getBuilder("client").bootstrapHash
      }.js`;
      let workerUrl = new URL("./ssr/worker.js", import.meta.url);

      this.#ssrWorker = new Worker(workerUrl, {
        workerData: {
          bootstrapUrl,
          appPath: this.build.getBuilder("client").SSRAppPath,
          clientComponentModuleMap:
            this.build.getBuilder("client").clientComponentModuleMap,
          ssrManifestModuleMap:
            this.build.getBuilder("client").ssrManifestModuleMap,
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
