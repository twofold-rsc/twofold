/**
 * The properties about the request provided when evaluating an authentication policy.
 */
export type AuthPolicyProps =
  | {
      type: "page";
      request: Request;
      routeParams: Record<string, string | undefined>;
    }
  | {
      type: "action";
      request: Request;
    }
  | {
      type: "api";
      request: Request;
    };

/**
 * An authentication policy.
 */
export type AuthPolicy = (props: AuthPolicyProps) => Promise<AuthPolicyResult>;

/**
 * An array of authentication policies (and optionally 'reset').
 */
export type AuthPolicyArray = ({ __reset: true } | AuthPolicy)[];

/**
 * This entry in an authentication policy array will cause any authentication policies prior to it to be discarded. By default, authentication policy arrays inherit the authentication policies of the parent route.
 */
export const reset: { __reset: true } = { __reset: true };

/**
 * The result returned by an authentication policy.
 */
export type AuthPolicyResult = {
  __allow: boolean;
  __message?: string;
  __error?: any;
  __response?: Response;
};

/**
 * Construct an authentication policy result that allows execution to continue.
 *
 * @returns The authentication policy result.
 */
export function allow(): AuthPolicyResult {
  return { __allow: true };
}

/**
 * Construct an authentication policy result that denies access to the route with a message.
 *
 * @param message The error message to return to the user.
 * @returns The authentication policy result.
 */
export function deny(message: string) {
  return { __allow: false, __message: message };
}

/**
 * Construct an authentication policy result that stops execution and returns the specified response immediately.
 *
 * @param response The response to return to the user.
 * @returns The authentication policy result.
 */
export function response(response: Response) {
  return { __allow: false, __response: response };
}

/**
 * Evaluates an authentication policy and returns an authentication policy result, catching any errors thrown.
 *
 * @param policy The authentication policy to evaluate.
 * @param props The properties about the request provided to the authentication policy.
 * @returns The authentication policy result.
 */
export async function evaluatePolicy(
  policy: AuthPolicy,
  props: AuthPolicyProps,
): Promise<AuthPolicyResult> {
  try {
    const result = await policy(props);
    if (result === undefined || result === null) {
      return deny("policy did not return valid result");
    }
    return result;
  } catch (err) {
    if (err instanceof Response) {
      return response(err);
    } else if (typeof err === "string") {
      return deny(err);
    } else {
      return { __allow: false, __message: err?.toString() ?? "", __error: err };
    }
  }
}
