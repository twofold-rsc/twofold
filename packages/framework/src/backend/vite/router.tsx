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
  isNotFoundError,
  isRedirectError,
  isUnauthorizedError,
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
  headerLocation,
  isContentType,
} from "./content-types.js";
import {
  onServerSideActionError,
  onServerSideApiMiddlewareError,
  onServerSideCatastrophicError,
  onServerSidePageMiddlewareError,
  onServerSidePageRenderError,
  onServerSideReceivedSsrError,
} from "./error-handling.server.js";
import fallbackErrorHtml from "./internal-error.html?inline";
import { NodePlatformInfo } from "@hattip/adapter-node/native-fetch";
import globalMiddleware from "virtual:twofold/server-global-middleware";
import { tfPaths } from "./special-pages.js";
import { ReplacementResponse } from "./replacement-response.js";

enum MiddlewareMode {
  Run,
  Skip,
}

export interface ModuleSurface {
  default?: FunctionComponent<
    LayoutProps | PageProps<any> | { error: unknown }
  >;
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
  error: unknown | undefined;
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
            [headerLocation]: url.pathname.slice(0, -1),
          },
        });
      }
    });

    // silence not found for external requests
    app.get("/**/*.js.map", async (ctx) => {
      return new Response(null, { status: 404 });
    });
    app.get(
      "/.well-known/appspecific/com.chrome.devtools.json",
      async (ctx) => {
        return new Response(null, { status: 204 });
      },
    );

    // cookies
    app.use(cookie());

    // fallback error handling - only hit when something catastrophic happens
    app.use(async (ctx) => {
      ctx.handleError = async (e: unknown) => {
        let request = ctx.request;
        let accepts = parseHeaderValue(request.headers.get(headerAccept));
        let error = e instanceof Error ? e : new Error("Internal server error");

        onServerSideCatastrophicError({
          applicationRuntime: this,
          url: new URL(request.url),
          request,
          error,
          willRecover: false,
          location: undefined,
        });

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

    // global middleware
    // @note: This used to be before errors and request store setup, but we want to be able to capture errors from global middleware.
    app.use(async (ctx) => {
      return await globalMiddleware(ctx.request);
    });

    // handle all requests here
    app.use(async (ctx) => {
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
      let rscStreamOrResponse: ReplacementResponse = undefined;
      if (actionResult?.returnValue?.type === "throw") {
        rscStreamOrResponse = await onServerSideActionError({
          applicationRuntime: this,
          url: new URL(request.url),
          request,
          error: actionResult.returnValue.error,
          willRecover: false,
          location: "action-request",
        });
      }

      // Return response from action result if it's present and
      // we don't have an RSC stream or response already set via
      // error handling.
      if (actionResult?.response && !rscStreamOrResponse) {
        return actionResult.response;
      }

      // Handle page request if the action hasn't already given us
      // a response stream.
      if (!rscStreamOrResponse) {
        rscStreamOrResponse = await this.runPage(request, actionResult);
      }

      // If we have a direct response from the page (for a redirect),
      // return that immediately.
      if (rscStreamOrResponse instanceof Response) {
        return rscStreamOrResponse;
      }

      // Return stream directly if RSC stream requested.
      if (renderRequest.isRsc) {
        return new Response(rscStreamOrResponse?.stream, {
          status: actionResult?.actionStatus ?? rscStreamOrResponse?.status,
          headers: {
            [headerContentType]: contentType.rsc,
          },
        });
      }

      invariant(
        rscStreamOrResponse !== undefined,
        "must have a response or RSC stream by this point",
      );

      // Use SSR module to render RSC stream to HTML.
      const [rscStreamForSsr, rscStreamForRecovery] =
        rscStreamOrResponse.stream.tee();
      const ssrEntryModule = await import.meta.viteRsc.loadModule<
        typeof import("./entrypoint/entry.ssr.js")
      >("ssr", "index");
      let ssrResult = await ssrEntryModule.renderHtmlOrError(rscStreamForSsr, {
        url: url,
        formState: actionResult?.formState,
        debugNojs: url.searchParams.has("__nojs"),
      });
      if (ssrResult.type === "stream") {
        return new Response(ssrResult.stream, {
          status: rscStreamOrResponse?.status,
          headers: {
            [headerContentType]: contentType.html,
          },
        });
      }

      // Handle known errors from SSR failure.
      let replacement: ReplacementResponse = await onServerSideReceivedSsrError(
        {
          applicationRuntime: this,
          url: url,
          request: request,
          error: ssrResult.error,
          willRecover: true,
          location: "ssr",
        },
      );
      if (replacement) {
        if (replacement instanceof Response) {
          return replacement;
        } else {
          const ssrReplacementResult = await ssrEntryModule.renderHtmlOrError(
            replacement.stream,
            {
              url: url,
              formState: actionResult?.formState,
              debugNojs: url.searchParams.has("__nojs"),
            },
          );
          if (ssrReplacementResult.type === "stream") {
            return new Response(ssrReplacementResult.stream, {
              status: replacement.status,
              headers: {
                [headerContentType]: contentType.html,
              },
            });
          } else {
            // Replacement result failed during SSR; proceed with the new error.
            console.error("SSR of replacement response also failed.");
            console.error(ssrReplacementResult.error);
            ssrResult = ssrReplacementResult;
          }
        }
      }

      // Use SSR module to render just the bootstrap and stream, with no hydration. This allows the error boundary on the client to handle the error.
      const ssrRecoveryStream = await ssrEntryModule.renderRecoveryHtml(
        rscStreamForRecovery,
        ssrResult.error,
        {
          url: url,
          formState: actionResult?.formState,
          debugNojs: url.searchParams.has("__nojs"),
        },
      );
      return new Response(ssrRecoveryStream, {
        status: 500,
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
        response = onServerSideApiMiddlewareError({
          applicationRuntime: this,
          url,
          request,
          error,
          willRecover: false,
          location: "api-middleware",
        });
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
        error: undefined,
      };
    } catch (e) {
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
        error: e,
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
        error: undefined,
      };
    } catch (e) {
      return {
        returnValue: undefined,
        actionStatus: undefined,
        formState: undefined,
        temporaryReferences: undefined,
        response: new Response("Internal Server Error: server action failed", {
          status: 500,
        }),
        error: e,
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
  ): Promise<ReplacementResponse> {
    const url = new URL(request.url);
    let page = this.#root.tree.findPageForPath(url.pathname);
    if (page) {
      return this.runPageForInstance(
        url,
        page,
        actionResult,
        request,
        MiddlewareMode.Run,
      );
    } else {
      return this.runSpecialPage(request, tfPaths.throwing.notFound);
    }
  }

  private async runPageForInstance(
    url: URL,
    page: Page,
    actionResult: ActionResultData | undefined,
    request: Request,
    middleware: MiddlewareMode,
    overridePageProps?: { error: unknown },
    overrideStatus?: number,
  ): Promise<ReplacementResponse> {
    const segments = await page.segments();

    const execPattern = page.pattern.exec(url);
    const params = execPattern?.pathname.groups ?? {};
    const props = {
      params,
      searchParams: url.searchParams,
      url,
      request,
    };

    if (middleware === MiddlewareMode.Run) {
      try {
        const layouts = page.layouts;
        const promises = [
          page.runMiddleware(props),
          ...layouts.map((layout) => layout.runMiddleware(props)),
        ];
        await Promise.all(promises);
      } catch (error: unknown) {
        return onServerSidePageMiddlewareError({
          applicationRuntime: this,
          url: url,
          request,
          error: error,
          willRecover: false,
          location: "page-middleware",
        });
      }
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
            ...((segment.path === tfPaths.throwing.internalServerError
              ? overridePageProps
              : undefined) ?? component.props),
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
      onError: (error: unknown) => {
        // If overridePageProps is set, we'll have an error that originated somewhere else and has already been reported.
        if (overridePageProps && overridePageProps.error === error) {
          if (
            typeof error === "object" &&
            error !== null &&
            "digest" in error &&
            typeof error.digest === "string"
          ) {
            // Pass digest from server to client unmodified. This is what allows the client to recognise special errors such as "not found".
            return error.digest;
          } else {
            // No digest for this error.
            return undefined;
          }
        }

        // Otherwise forward error to error handling.
        return onServerSidePageRenderError({
          applicationRuntime: this,
          url: url,
          request,
          error: error,
          willRecover: true,
          location: "page",
        });
      },
    };
    return {
      status: overrideStatus,
      stream: renderToReadableStream<RscPayload>(rscPayload, rscOptions),
    };
  }

  runSpecialPage(
    request: Request,
    specialPage: string,
    error?: unknown,
  ): Promise<ReplacementResponse> {
    let page = this.#root.tree.findPageForPath(specialPage);
    invariant(page, `Could not find special page '${specialPage}'`);

    let overrideStatus;
    if (
      specialPage === tfPaths.throwing.notFound ||
      specialPage === tfPaths.rendered.notFound
    ) {
      overrideStatus = 404;
    } else if (
      specialPage === tfPaths.throwing.unauthorized ||
      specialPage === tfPaths.rendered.unauthorized
    ) {
      overrideStatus = 403;
    } else if (specialPage === tfPaths.throwing.internalServerError) {
      overrideStatus = 500;
    }

    return this.runPageForInstance(
      new URL(request.url),
      page,
      undefined,
      request,
      MiddlewareMode.Skip,
      error
        ? {
            error,
          }
        : undefined,
      overrideStatus,
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
          [headerLocation]: `${redirectUrl.pathname}${URL_POSTFIX}${redirectUrl.search}`,
        },
      });
    }

    if (!isRsc) {
      return new Response(null, {
        status: status ?? 303,
        headers: {
          [headerLocation]: targetUrl,
        },
      });
    } else {
      return new Response(
        JSON.stringify({
          type: "twofold-offsite-redirect",
          url: targetUrl,
          status: status,
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
    let specialPages = ApplicationRuntime.loadSpecialPages(modules);
    let [rootLayout, otherLayouts] = partition(layouts, (x) => x.path === "/");

    if (rootLayout.length === 0) {
      throw new Error("No root layout");
    }

    let root = rootLayout[0]!;

    otherLayouts.forEach((layout) => root.addChild(layout));
    catchBoundaries.forEach((catchBoundary) => root.addChild(catchBoundary));
    pages.forEach((page) => root.addChild(page));
    errorTemplates.forEach((errorTemplate) => root.addChild(errorTemplate));
    specialPages.forEach((page) => root.addChild(page));

    root.addWrapper(outerRootWrapper);

    return root;
  }

  private static hasSuffix(relativePath: string, suffix: string) {
    return (
      relativePath.endsWith(`${suffix}.tsx`) ||
      relativePath.endsWith(`${suffix}.ts`)
    );
  }

  private static snipSuffix(relativePath: string, suffix: string) {
    if (relativePath.endsWith(`.tsx`)) {
      return relativePath.slice(0, -`${suffix}.tsx`.length);
    } else if (relativePath.endsWith(`.ts`)) {
      return relativePath.slice(0, -`${suffix}.ts`.length);
    } else {
      throw new Error(
        `'${relativePath}' does not have '.tsx' or '.ts' as a suffix.`,
      );
    }
  }

  private static loadApis(modules: ModuleMap): API[] {
    return Object.getOwnPropertyNames(modules)
      .filter((relativePath) =>
        ApplicationRuntime.hasSuffix(relativePath, ".api"),
      )
      .map((relativePath) => {
        let path = ApplicationRuntime.snipSuffix(relativePath.slice(2), ".api");
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
      .filter((relativePath) =>
        ApplicationRuntime.hasSuffix(relativePath, ".page"),
      )
      .map((relativePath) => {
        let path = ApplicationRuntime.snipSuffix(
          relativePath.slice(2),
          ".page",
        );
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
      .filter((relativePath) =>
        ApplicationRuntime.hasSuffix(relativePath, "/layout"),
      )
      .map((relativePath) => {
        let path = ApplicationRuntime.snipSuffix(
          relativePath.slice(2),
          "/layout",
        );
        return new Layout({
          path: `/${path}`,
          css: undefined,
          loadModule: modules[relativePath]!,
        });
      });
  }

  private static loadErrorTemplates(modules: ModuleMap): ErrorTemplate[] {
    let templates = Object.getOwnPropertyNames(modules)
      .filter((relativePath) =>
        ApplicationRuntime.hasSuffix(relativePath, ".error"),
      )
      .map((relativePath) => {
        let path = `/${ApplicationRuntime.snipSuffix(relativePath.slice(2), ".error")}`;
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

  private static loadSpecialPages(modules: ModuleMap): Page[] {
    const specialPages = {
      [tfPaths.throwing.notFound]: () =>
        import("../../client/pages/throwing/not-found.js"),
      [tfPaths.throwing.unauthorized]: () =>
        import("../../client/pages/throwing/unauthorized.js"),
      [tfPaths.throwing.internalServerError]: () =>
        import("../../client/pages/throwing/internal-server-error.js"),
      [tfPaths.rendered.notFound]: () =>
        import("../../client/pages/rendered/not-found.js"),
      [tfPaths.rendered.unauthorized]: () =>
        import("../../client/pages/rendered/unauthorized.js"),
    };
    const pages = [];
    for (const key of Object.getOwnPropertyNames(specialPages)) {
      pages.push(
        new Page({
          path: key,
          loadModule: specialPages[key] as () => Promise<ModuleSurface>,
        }),
      );
    }
    return pages;
  }
}
