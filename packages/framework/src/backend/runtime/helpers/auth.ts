import { pathToFileURL } from "node:url";
import { API } from "../../build/rsc/api.js";
import { Layout } from "../../build/rsc/layout.js";
import { Page } from "../../build/rsc/page.js";
import type { Node } from "../../build/rsc/tree-node.js";
import { Runtime } from "../../runtime.js";
import {
  allow,
  AuthPolicy,
  AuthPolicyArray,
  AuthPolicyProps,
  AuthPolicyResult,
  evaluatePolicy,
} from "../../auth/auth.js";
import { CompiledServerAction } from "../../build/rsc/compiled-server-action.js";

export async function evaluatePolicyArray(
  runtime: Runtime,
  node: Node,
  props: AuthPolicyProps,
): Promise<AuthPolicyResult> {
  let authPolicyArrays: AuthPolicyArray[] = [];
  let current: Node | undefined = node;
  while (current) {
    if (
      current instanceof Layout ||
      current instanceof Page ||
      current instanceof API ||
      current instanceof CompiledServerAction
    ) {
      authPolicyArrays.push(await current.getAuthPolicy());
    } else if (!current) {
      console.error(current);
      throw new Error(`Unsupported parent`);
    }
    current = current.parent;
  }

  if (await runtime.build.getBuilder("rsc").hasRootAuth()) {
    let rootAuthPath = runtime.build.getBuilder("rsc").rootAuthPath;
    let rootAuthModule = await import(pathToFileURL(rootAuthPath).href);
    if (typeof rootAuthModule.default === "function") {
      authPolicyArrays.push([rootAuthModule.default]);
    }
  }

  let effectiveAuthPolicyArray: AuthPolicy[] = [];
  for (let i = authPolicyArrays.length - 1; i >= 0; i--) {
    let authPolicyArray = authPolicyArrays[i];
    if (authPolicyArray === undefined) {
      return {
        __allow: false,
        __message: "authPolicyArrays missing element",
        __error: new Error("authPolicyArrays missing element"),
      };
    }
    for (let k = 0; k < authPolicyArray.length; k++) {
      let authPolicy = authPolicyArray[k];
      if (authPolicy === undefined) {
        return {
          __allow: false,
          __message: "authPolicy missing element",
          __error: new Error("authPolicy missing element"),
        };
      }
      if ("__reset" in authPolicy) {
        if (authPolicy.__reset) {
          effectiveAuthPolicyArray = [];
        } else {
          return {
            __allow: false,
            __message: "authPolicy unexpected __reset value",
            __error: new Error("authPolicy unexpected __reset value"),
          };
        }
      } else {
        effectiveAuthPolicyArray.push(authPolicy);
      }
    }
  }

  for (const authPolicy of effectiveAuthPolicyArray) {
    const authPolicyResult = await evaluatePolicy(authPolicy, props);
    if (authPolicyResult.__allow) {
      continue;
    } else {
      return authPolicyResult;
    }
  }

  return allow();
}

export async function evaluatePolicyArrayToResponse(
  runtime: Runtime,
  node: Node,
  props: AuthPolicyProps,
  createErrorResponse: (error: any) => Promise<Response>,
  createUnauthorizedResponse: (
    message: string | undefined,
  ) => Promise<Response>,
): Promise<Response | undefined> {
  const authResult = await evaluatePolicyArray(runtime, node, props);
  if (!authResult.__allow) {
    if (authResult.__response) {
      return authResult.__response;
    } else if (authResult.__error) {
      return await createErrorResponse(authResult.__error);
    } else if (authResult.__message) {
      return await createUnauthorizedResponse(authResult.__message);
    } else {
      return await createUnauthorizedResponse(undefined);
    }
  }
  return undefined;
}
