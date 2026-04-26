import {
  ComponentType,
  createElement,
  FunctionComponent,
  ReactElement,
} from "react";
import type { LayoutProps, PageProps } from "../../types/importable.js";
import { Layout } from "../build/rsc/layout.js";
import { partition } from "../utils/partition.js";
import { Page } from "../build/rsc/page.js";
import { parseRenderRequest, URL_POSTFIX } from "./entrypoint/request.js";
import { API } from "../build/rsc/api.js";
import { applyPathParams, pathMatches } from "../runtime/helpers/routing.js";
import {
  isRedirectError,
  redirectErrorInfo,
} from "../runtime/helpers/errors.js";
import { ReactFormState } from "react-dom/client";
import { RscActionPayload, RscPayload } from "./entrypoint/payload.js";
import {
  renderToReadableStream,
  createTemporaryReferenceSet,
  decodeReply,
  loadServerAction,
  decodeAction,
  decodeFormState,
} from "@vitejs/plugin-rsc/rsc";
import xxhash from "xxhash-wasm";
import { RouteStackEntry } from "../../client/apps/client/contexts/route-stack-context.js";
import { runStore, Store } from "../stores/rsc-store.js";
import { SerializeOptions } from "cookie";
import { createRouter } from "@hattip/router";
import { cookie } from "@hattip/cookie";
import { decrypt, encrypt } from "../encryption.js";
import { randomBytes } from "node:crypto";
import { AdapterRequestContext, type HattipHandler } from "@hattip/core";
import { ErrorTemplate } from "../build/rsc/error-template.js";
import { CatchBoundary } from "../build/rsc/catch-boundary.js";
import { Generic } from "../build/rsc/generic.js";
import { Wrapper } from "../build/rsc/wrapper.js";
import { invariant } from "../utils/invariant.js";
import { parseHeaderValue } from "@hattip/headers";
import {
  contentType,
  headerAccept,
  headerContentType,
  isContentType,
} from "./content-types.js";
import {
  onServerSideActionError,
  onServerSideApiMiddlewareError,
  onServerSideCatastrophicError,
  onServerSidePageMiddlewareError,
  onServerSidePageRenderError,
} from "./error-handling.server.js";
import fallbackErrorHtml from "./internal-error.html?inline";
import { NodePlatformInfo } from "@hattip/adapter-node/native-fetch";

const tfPathsUnauthorized = "/__tf/errors/unauthorized";
const tfPathsNotFound = "/__tf/errors/not-found";

export interface ModuleSurface {
  default?: FunctionComponent<LayoutProps | PageProps<any>>;
  before?: (props: any) => Promise<void>;
  GET?: (req: Request) => Promise<Response>;
  POST?: (req: Request) => Promise<Response>;
  [key: string | symbol]: any | undefined;
}

type ModuleMap = {
  [path: string]: () => Promise<ModuleSurface>;
};

class ActionResultData {
  returnValue: RscActionPayload | undefined;
  actionStatus: number | undefined;
  formState: ReactFormState | undefined;
  temporaryReferences: unknown | undefined;
  response: Response | undefined;
}

let { h64Raw } = await xxhash();

function componentsToTree<T extends object>(
  list: {
    component: ComponentType<T>;
    props: T;
  }[],
): ReactElement {
  invariant(list[0], "Invalid component list");

  let { component, props } = list[0];
  if (list.length === 1) {
    return createElement<T>(component, props);
  } else {
    return createElement<T>(component, props, componentsToTree(list.slice(1)));
  }
}

export class ApplicationRuntime {
  #root: Layout;
  #apiEndpoints: API[];
  #reqId: number;
  #handler: HattipHandler<unknown>;

  constructor(modules: ModuleMap) {
    this.#root = ApplicationRuntime.loadRoot(modules);
    this.#apiEndpoints = ApplicationRuntime.loadApis(modules);
    this.#reqId = 0;
    this.#handler = this.createHandler();
  }

  private createHandler(): HattipHandler<unknown> {
    const app = createRouter();

    // path normalization
    app.use(async (ctx) => {
      let url = new URL(ctx.request.url);
      if (url.pathname.endsWith("/") && url.pathname !== "/") {
        return new Response(null, {
          status: 307,
          headers: {
            Location: url.pathname.slice(0, -1),
          },
        });
      }
    });

    // cookies
    app.use(cookie());

    // fallback error handling - only hit when something catastrophic happens
    app.use(async (ctx) => {
      ctx.handleError = async (e: unknown) => {
        let request = ctx.request;
        let accepts = parseHeaderValue(request.headers.get(headerAccept));
        let error = e instanceof Error ? e : new Error("Internal server error");

        onServerSideCatastrophicError(request, error);

        let status =
          "digest" in error &&
          typeof error.digest === "string" &&
          error.digest === "TwofoldNotFoundError"
            ? 404
            : 500;

        if (isContentType.rsc(accepts)) {
          // maybe let the runtime own this?
          let stream = renderToReadableStream<RscPayload>(
            {
              stack: [
                {
                  type: "error",
                  error: error,
                },
              ],
              path: ctx.request.url,
              action: undefined,
              formState: undefined,
            },
            {},
          );
          return new Response(stream, {
            status,
            headers: {
              [headerContentType]: contentType.rsc,
            },
          });
        } else if (isContentType.html(accepts)) {
          let html = fallbackErrorHtml;
          return new Response(html, {
            status,
            headers: {
              [headerContentType]: contentType.html,
            },
          });
        } else {
          let text = `${error.message}\n\n${error.stack}`;
          return new Response(text, {
            status,
            headers: {
              [headerContentType]: contentType.plain,
            },
          });
        }
      };
    });

    // set up request store
    app.use(async (ctx) => {
      this.#reqId = this.#reqId + 1;

      let defaultCookieOptions: SerializeOptions = {
        path: "/",
      };

      let store: Store = {
        reqId: this.#reqId,
        build:
          process.env.NODE_ENV === "production" ? "production" : "development",
        canReload: process.env.NODE_ENV === "development",
        cookies: {
          all: () => {
            return ctx.cookie;
          },
          set: (name, value, options) => {
            let cookieOptions = {
              ...defaultCookieOptions,
              ...options,
            };

            ctx.setCookie(name, value, cookieOptions);
          },
          get: (name) => {
            return ctx.cookie[name];
          },
          destroy: (name, options) => {
            let cookieOptions = {
              ...defaultCookieOptions,
              ...options,
            };

            ctx.deleteCookie(name, cookieOptions);
          },
          outgoingCookies: () => ctx.outgoingCookies,
        },
        encryption: {
          encrypt: (value) => {
            let key = process.env.TWOFOLD_SECRET_KEY;
            if (typeof key !== "string") {
              throw new Error("TWOFOLD_SECRET_KEY is not set");
            }

            return encrypt(value, key);
          },
          decrypt: (value) => {
            let key = process.env.TWOFOLD_SECRET_KEY;
            if (typeof key !== "string") {
              throw new Error("TWOFOLD_SECRET_KEY is not set");
            }

            return decrypt(value, key);
          },
        },
        flash: {
          add(message) {
            let flashId = randomBytes(12).toString("hex");
            let data = JSON.stringify(message);
            ctx.setCookie(`_tf_flash_${flashId}`, data, {
              path: "/",
              secure: false,
              maxAge: 60 * 60 * 24,
            });
          },
        },
        context: null,
        assets: [],
      };

      return runStore(store, () => ctx.next());
    });

    // handle all requests here
    app.use("/**/*", async (ctx) => {
      const renderRequest = parseRenderRequest(ctx.request);
      const request = renderRequest.request;
      const url = new URL(request.url);

      // Handle API requests.
      const apiResponse = await this.runApi(request);
      if (apiResponse) {
        return apiResponse;
      }

      // Handle actions.
      let actionResult: ActionResultData | undefined = undefined;
      if (renderRequest.isAction) {
        if (renderRequest.actionId) {
          actionResult = await this.runActionViaRequest(
            request,
            renderRequest.actionId,
          );
        } else {
          actionResult = await this.runActionViaFormState(request);
        }
      }

      // If the action result throws an error, and the error is a safe error, handle it here.
      if (
        actionResult?.returnValue?.type === "throw" &&
        isRedirectError(actionResult.returnValue.error)
      ) {
        const redirectInfo = redirectErrorInfo(actionResult.returnValue.error);
        return this.createRedirectResponse(url, redirectInfo.url, true);
      }

      // Return response from action result if present.
      if (actionResult?.response) {
        return actionResult.response;
      }

      // Handle page requests.
      const rscStreamOrResponse = await this.runPage(request, actionResult);
      if (rscStreamOrResponse instanceof Response) {
        return rscStreamOrResponse;
      }

      // Return stream directly if RSC stream requested.
      if (renderRequest.isRsc) {
        return new Response(rscStreamOrResponse, {
          status: actionResult?.actionStatus,
          headers: {
            [headerContentType]: contentType.rsc,
          },
        });
      }

      // Use SSR module to render RSC stream to HTML.
      const ssrEntryModule = await import.meta.viteRsc.loadModule<
        typeof import("./entrypoint/entry.ssr.js")
      >("ssr", "index");
      const ssrResult = await ssrEntryModule.renderHTML(rscStreamOrResponse, {
        url: url,
        formState: actionResult?.formState,
        debugNojs: url.searchParams.has("__nojs"),
      });
      return new Response(ssrResult.stream, {
        status: ssrResult.status,
        headers: {
          [headerContentType]: contentType.html,
        },
      });
    });

    // set handler
    return app.buildHandler();
  }

  async fetchFromContext(
    context: AdapterRequestContext<NodePlatformInfo>,
  ): Promise<Response> {
    return await this.#handler(context);
  }

  async fetch(request: Request): Promise<Response> {
    const context: AdapterRequestContext<unknown> = {
      request,
      ip: "",
      platform: null,
      env: (variable) => {
        return process.env[variable];
      },
      passThrough: () => {},
      waitUntil: (promise) => {},
    };
    return await this.#handler(context);
  }

  private async runApi(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const realPath = url.pathname;

    const [staticAndDynamicApis, catchAllApis] = partition(
      this.#apiEndpoints,
      (api) => !api.isCatchAll,
    );
    const [dynamicApis, staticApis] = partition(
      staticAndDynamicApis,
      (api) => api.isDynamic,
    );

    const dynamicApisInOrder = dynamicApis.toSorted(
      (a, b) => a.dynamicSegments.length - b.dynamicSegments.length,
    );

    const api =
      staticApis.find((api) => pathMatches(api.path, realPath)) ??
      dynamicApisInOrder.find((api) => pathMatches(api.path, realPath)) ??
      catchAllApis.find((api) => pathMatches(api.path, realPath));

    if (!api) {
      return undefined;
    }

    const module = await api.loadModule();
    const execPattern = api.pattern.exec(url);
    const props = {
      params: execPattern?.pathname.groups ?? {},
      searchParams: url.searchParams,
      url,
      request,
    };

    if (module.before) {
      await module.before(props);
    }

    const method = request.method.toUpperCase();
    let response: Response;

    if (
      Object.hasOwn(module, method) &&
      method in module &&
      typeof module[method] === "function"
    ) {
      try {
        response = await module[method](props);
      } catch (error: unknown) {
        response = onServerSideApiMiddlewareError(error);
      }
    } else {
      response = new Response("Method not exported", { status: 404 });
    }

    return response;
  }

  private async runActionViaRequest(
    request: Request,
    actionId: string,
  ): Promise<ActionResultData> {
    const contentType = request.headers.get("content-type");
    const body = contentType?.startsWith("multipart/form-data")
      ? await request.formData()
      : await request.text();
    const temporaryReferences = createTemporaryReferenceSet();
    const args = await decodeReply(body, { temporaryReferences });
    const action = await loadServerAction(actionId);
    try {
      const data = await action.apply(null, args);
      return {
        returnValue: {
          type: "return",
          result: data,
        },
        actionStatus: undefined,
        formState: undefined,
        temporaryReferences,
        response: undefined,
      };
    } catch (e) {
      onServerSideActionError(e);
      return {
        returnValue: {
          type: "throw",
          error:
            e instanceof Error
              ? e
              : new Error(e?.toString() ?? "unknown error"),
        },
        actionStatus: 500,
        formState: undefined,
        temporaryReferences,
        response: undefined,
      };
    }
  }

  private async runActionViaFormState(
    request: Request,
  ): Promise<ActionResultData> {
    const formData = await request.formData();
    const decodedAction = await decodeAction(formData);
    try {
      const result = await decodedAction();
      return {
        returnValue: undefined,
        actionStatus: undefined,
        formState: await decodeFormState(result, formData),
        temporaryReferences: undefined,
        response: undefined,
      };
    } catch (e) {
      onServerSideActionError(e);
      return {
        returnValue: undefined,
        actionStatus: undefined,
        formState: undefined,
        temporaryReferences: undefined,
        response: new Response("Internal Server Error: server action failed", {
          status: 500,
        }),
      };
    }
  }

  private static hash(str: string) {
    let encoder = new TextEncoder();
    let data = encoder.encode(str);
    let hash = h64Raw(data);
    return hash.toString(16);
  }

  private async runPage(
    request: Request,
    actionResult: ActionResultData | undefined,
  ): Promise<ReadableStream<Uint8Array> | Response> {
    const url = new URL(request.url);
    let page = this.#root.tree.findPageForPath(url.pathname);
    if (page) {
      return this.runPageForInstance(url, page, actionResult, request);
    } else {
      return this.createNotFoundResponse(request);
    }
  }

  private async runPageForInstance(
    url: URL,
    page: Page,
    actionResult: ActionResultData | undefined,
    request: Request,
  ): Promise<ReadableStream<Uint8Array> | Response> {
    const segments = await page.segments();

    const execPattern = page.pattern.exec(url);
    const params = execPattern?.pathname.groups ?? {};
    const props = {
      params,
      searchParams: url.searchParams,
      url,
      request,
    };

    try {
      const layouts = page.layouts;
      const promises = [
        page.runMiddleware(props),
        ...layouts.map((layout) => layout.runMiddleware(props)),
      ];
      await Promise.all(promises);
    } catch (error: unknown) {
      return onServerSidePageMiddlewareError(this, url, request, error);
    }

    const routeStack = segments.map((segment): RouteStackEntry => {
      const segmentKey = `${segment.path}:${applyPathParams(
        segment.path,
        params,
      )}`;

      // we hash the key because if they "look" like urls or paths
      // certain bots will try to crawl them
      const key = ApplicationRuntime.hash(segmentKey);

      const components = segment.components;
      const componentsWithProps = components.map((component, index) => {
        return {
          component: component.func,
          props: {
            ...component.props,
            ...(component.requirements.includes("dynamicRequest") ? props : {}),
            ...(index === 0 ? { key } : {}),
          },
        };
      });

      return {
        type: "tree",
        key: key,
        tree: componentsToTree(componentsWithProps),
      };
    });

    const rscPayload: RscPayload = {
      stack: routeStack,
      path: url.pathname,
      action: actionResult?.returnValue,
      formState: actionResult?.formState,
    };
    const rscOptions = {
      temporaryReferences: actionResult?.temporaryReferences,
      onError: onServerSidePageRenderError.bind(null, url),
    };
    return renderToReadableStream<RscPayload>(rscPayload, rscOptions);
  }

  createNotFoundResponse(
    request: Request,
  ): Promise<ReadableStream<Uint8Array> | Response> {
    let page = this.#root.tree.findPageForPath(tfPathsNotFound);
    invariant(page, "Could not find not-found page");
    return this.runPageForInstance(
      new URL(request.url),
      page,
      undefined,
      request,
    );
  }

  createUnauthorizedResponse(
    request: Request,
  ): Promise<ReadableStream<Uint8Array> | Response> {
    let page = this.#root.tree.findPageForPath(tfPathsUnauthorized);
    invariant(page, "Could not find unauthorized page");
    return this.runPageForInstance(
      new URL(request.url),
      page,
      undefined,
      request,
    );
  }

  createRedirectResponse(
    requestUrl: URL,
    targetUrl: string,
    isRsc: boolean,
    status?: number,
  ): Response {
    let redirectUrl = new URL(targetUrl, requestUrl);
    let isRelative =
      redirectUrl.origin === requestUrl.origin && targetUrl.startsWith("/");

    if (isRsc && isRelative) {
      return new Response(null, {
        status: status ?? 303,
        headers: {
          location: `${redirectUrl.pathname}${URL_POSTFIX}${redirectUrl.search}`,
        },
      });
    }

    if (!isRsc) {
      return new Response(null, {
        status: status ?? 303,
        headers: {
          location: targetUrl,
        },
      });
    } else {
      return new Response(
        JSON.stringify({
          type: "twofold-offsite-redirect",
          targetUrl,
          status,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }
  }

  private static loadRoot(modules: ModuleMap): Layout {
    let pages = ApplicationRuntime.loadPages(modules);
    let layouts = ApplicationRuntime.loadLayouts(modules);
    let errorTemplates = ApplicationRuntime.loadErrorTemplates(modules);
    let catchBoundaries = ApplicationRuntime.loadCatchBoundaries(
      modules,
      errorTemplates,
    );
    let outerRootWrapper = ApplicationRuntime.loadOuterRootWrapper();
    let [rootLayout, otherLayouts] = partition(layouts, (x) => x.path === "/");

    if (rootLayout.length === 0) {
      throw new Error("No root layout");
    }

    let root = rootLayout[0]!;

    otherLayouts.forEach((layout) => root.addChild(layout));
    catchBoundaries.forEach((catchBoundary) => root.addChild(catchBoundary));
    pages.forEach((page) => root.addChild(page));
    errorTemplates.forEach((errorTemplate) => root.addChild(errorTemplate));

    root.addChild(ApplicationRuntime.loadUnauthorizedPage(modules));
    root.addChild(ApplicationRuntime.loadNotFoundPage(modules));

    root.addWrapper(outerRootWrapper);

    return root;
  }

  private static loadApis(modules: ModuleMap): API[] {
    return Object.getOwnPropertyNames(modules)
      .filter((relativePath) => relativePath.endsWith(".api.tsx"))
      .map((relativePath) => {
        let path = relativePath.slice(2).slice(0, -".api.tsx".length);
        if (path === "index" || path.endsWith("/index")) {
          path = path.slice(0, -6);
        }
        return new API({
          path: `/${path}`,
          loadModule: modules[relativePath]!,
        });
      });
  }

  private static loadPages(modules: ModuleMap): Page[] {
    return Object.getOwnPropertyNames(modules)
      .filter((relativePath) => relativePath.endsWith(".page.tsx"))
      .map((relativePath) => {
        let path = relativePath.slice(2).slice(0, -".page.tsx".length);
        if (path === "index" || path.endsWith("/index")) {
          path = path.slice(0, -6);
        }
        return new Page({
          path: `/${path}`,
          css: undefined,
          loadModule: modules[relativePath]!,
        });
      });
  }

  private static loadLayouts(modules: ModuleMap): Layout[] {
    return Object.getOwnPropertyNames(modules)
      .filter((relativePath) => relativePath.endsWith("/layout.tsx"))
      .map((relativePath) => {
        let path = relativePath.slice(2).slice(0, -"/layout.tsx".length);
        return new Layout({
          path: `/${path}`,
          css: undefined,
          loadModule: modules[relativePath]!,
        });
      });
  }

  private static loadErrorTemplates(modules: ModuleMap): ErrorTemplate[] {
    let templates = Object.getOwnPropertyNames(modules)
      .filter((relativePath) => relativePath.endsWith(".error.tsx"))
      .map((relativePath) => {
        let path = `/${relativePath.slice(2).slice(0, -".error.tsx".length)}`;
        let tag = path.split("/").at(-1) ?? "unknown";
        return new ErrorTemplate({
          tag,
          path,
          loadModule: modules[relativePath]!,
        });
      });

    // if there is no root level unauthorized template we will add the default
    if (!templates.some((t) => t.tag === "unauthorized" && t.path === "/")) {
      templates.push(
        new ErrorTemplate({
          tag: "unauthorized",
          path: "/",
          loadModule: () =>
            import("../../client/components/error-templates/unauthorized.js"),
        }),
      );
    }

    // if there is no root level not found template we will add the default
    if (!templates.some((t) => t.tag === "not-found" && t.path === "/")) {
      templates.push(
        new ErrorTemplate({
          tag: "not-found",
          path: "/",
          loadModule: () =>
            import("../../client/components/error-templates/not-found.js"),
        }),
      );
    }

    return templates;
  }

  private static loadCatchBoundaries(
    modules: ModuleMap,
    errorTemplates: ErrorTemplate[],
  ): CatchBoundary[] {
    let routeStackPlaceholder = new Generic({
      loadModule: () =>
        import("../../client/components/route-stack/placeholder.js"),
    });
    let catchBoundaryLoadModule = () =>
      import("../../client/components/boundaries/catch-boundary.js");

    let catchBoundaryMap = new Map<string, CatchBoundary>();

    // always have a root level catch boundary
    catchBoundaryMap.set(
      "/",
      new CatchBoundary({
        path: "/",
        loadModule: catchBoundaryLoadModule,
        routeStackPlaceholder,
      }),
    );

    for (let errorTemplate of errorTemplates) {
      let path =
        errorTemplate.path === "/"
          ? "/"
          : "/" +
            errorTemplate.path
              .split("/")
              .filter(Boolean)
              .slice(0, -1)
              .join("/");

      let catchBoundary = catchBoundaryMap.get(path);

      if (!catchBoundary) {
        catchBoundary = new CatchBoundary({
          path,
          loadModule: catchBoundaryLoadModule,
          routeStackPlaceholder,
        });

        catchBoundaryMap.set(path, catchBoundary);
      }
    }

    return [...catchBoundaryMap.values()];
  }

  private static loadOuterRootWrapper(): Wrapper {
    return new Wrapper({
      path: "/",
      loadModule: () => import("../../client/components/outer-root-wrapper.js"),
    });
  }

  private static loadUnauthorizedPage(modules: ModuleMap): Page {
    return new Page({
      path: tfPathsUnauthorized,
      loadModule: async () =>
        (await import("../../client/pages/unauthorized.js")) as ModuleSurface,
    });
  }

  private static loadNotFoundPage(modules: ModuleMap): Page {
    return new Page({
      path: tfPathsNotFound,
      loadModule: async () =>
        (await import("../../client/pages/not-found.js")) as ModuleSurface,
    });
  }
}
