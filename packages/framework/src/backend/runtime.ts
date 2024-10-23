import "./monkey-patch.js";
import { MessageChannel, Worker } from "node:worker_threads";
import { PageRequest } from "./runtime/page-request.js";
import { create } from "./server.js";
import { DevelopmentEnvironment } from "./build/environments/development.js";
import { ProductionEnvironment } from "./build/environments/production.js";
import { pathToFileURL } from "node:url";
import { APIRequest } from "./runtime/api-request.js";
import { ReactNode } from "react";
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

type Environment = DevelopmentEnvironment | ProductionEnvironment;

export class Runtime {
  #hostname = "0.0.0.0";
  #port = 3000;
  #environment: Environment;
  #ssrWorker?: Worker;

  constructor(environment: Environment) {
    this.#environment = environment;
  }

  get environment() {
    return this.#environment;
  }

  get clientComponentMap() {
    return this.#environment.getBuilder("client").clientComponentMap;
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

  async start() {
    if (this.#environment.name === "development") {
      this.#environment.watch();
      this.#environment.events.on("complete", async () => {
        this.createSSRWorker();
      });
    }

    this.createSSRWorker();
    await this.server();
  }

  // server

  private async server() {
    let server = await create(this);
    await server.start();
  }

  // api endpoints

  apiRequest(request: Request) {
    let url = new URL(request.url);

    let api = this.#environment
      .getBuilder("rsc")
      .apiEndpoints.find((api) => api.pattern.test(url.pathname, this.baseUrl));

    if (api) {
      return new APIRequest({ api, request, runtime: this });
    }
  }

  // pages

  pageRequest(request: Request) {
    let url = new URL(request.url);

    let page = this.#environment
      .getBuilder("rsc")
      .tree.findPage((page) => page.pattern.test(url.pathname, this.baseUrl));

    let response = page
      ? new PageRequest({ page, request, runtime: this })
      : this.notFoundPageRequest(request);

    return response;
  }

  notFoundPageRequest(request: Request) {
    return new PageRequest({
      page: this.#environment.getBuilder("rsc").notFoundPage,
      request,
      runtime: this,
      conditions: ["not-found"],
    });
  }

  // actions

  isAction(id: string) {
    let serverActionMap = this.#environment.getBuilder("rsc").serverActionMap;
    return serverActionMap.has(id);
  }

  async getAction(id: string) {
    let serverActionMap = this.#environment.getBuilder("rsc").serverActionMap;
    let action = serverActionMap.get(id);

    if (!action) {
      throw new Error("Invalid action id");
    }

    let actionUrl = pathToFileURL(action.path);
    let module = await import(actionUrl.href);

    let fn = module[action.export];

    return fn;
  }

  async runAction(id: string, args: unknown[]) {
    let fn = await this.getAction(id);
    return fn(...args);
  }

  // renders

  async renderRSCStreamFromTree(tree: ReactNode) {
    let clientComponentMap =
      this.#environment.getBuilder("client").clientComponentMap;

    let streamError: unknown;

    let rscStream = renderToReadableStream(tree, clientComponentMap, {
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
    data: Record<string, any> = {}
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
      [port2, rscStream, writeStream]
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

  private async createSSRWorker() {
    if (this.#ssrWorker) {
      await this.#ssrWorker.terminate();
      this.#ssrWorker = undefined;
    }

    // only create if the build is done
    // emit some event with ssr is ready

    if (!this.#environment.error) {
      let bootstrapUrl = `/_assets/client-app/bootstrap/${
        this.#environment.getBuilder("client").bootstrapHash
      }.js`;
      let workerUrl = new URL("./ssr/worker.js", import.meta.url);

      this.#ssrWorker = new Worker(workerUrl, {
        workerData: {
          bootstrapUrl,
          appPath: this.#environment.getBuilder("client").SSRAppPath,
          clientComponentModuleMap:
            this.#environment.getBuilder("client").clientComponentModuleMap,
          ssrManifestModuleMap:
            this.#environment.getBuilder("client").ssrManifestModuleMap,
        },
        execArgv: ["-C", "default"],
        env: {
          NODE_OPTIONS: "",
          NODE_ENV: this.#environment.name,
        },
      });
    }
  }
}
