import { API } from "../../build/rsc/api.js";
import { Layout } from "../../build/rsc/layout.js";
import { Page } from "../../build/rsc/page.js";
import type { Node } from "../../build/rsc/tree-node.js";
import {
  allow,
  AuthPolicy,
  AuthPolicyArray,
  AuthPolicyProps,
  AuthPolicyResult,
  evaluatePolicy,
} from "../../auth/auth.js";
import globalAuth from "virtual:twofold/server-global-auth";
import { ReplacementResponse } from "../../vite/replacement-response.js";

export async function evaluatePolicyArray(
  node: Node,
  props: AuthPolicyProps,
  serverActionAuth?: AuthPolicyArray,
): Promise<AuthPolicyResult> {
  let authPolicyArrays: AuthPolicyArray[] = [];

  if (serverActionAuth) {
    authPolicyArrays.push(serverActionAuth);
  }

  let current: Node | undefined = node;
  while (current) {
    if (
      current instanceof Layout ||
      current instanceof Page ||
      current instanceof API
    ) {
      authPolicyArrays.push(await current.getAuthPolicy());
    } else if (!current) {
      console.error(current);
      throw new Error(`Unsupported parent`);
    }
    current = current.parent;
  }

  if (globalAuth && typeof globalAuth === "function") {
    authPolicyArrays.push([globalAuth]);
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

export async function evaluatePolicyArrayToResponse<
  T extends Response | ReplacementResponse,
>(
  node: Node,
  props: AuthPolicyProps,
  createErrorResponse: (error: any) => Promise<T>,
  createUnauthorizedResponse: (message: string | undefined) => Promise<T>,
): Promise<T | undefined> {
  const authResult = await evaluatePolicyArray(node, props);
  if (!authResult.__allow) {
    if (authResult.__response) {
      return authResult.__response as T;
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
