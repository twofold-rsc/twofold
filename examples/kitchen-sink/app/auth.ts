import cookies from "@twofold/framework/cookies";
import {
  allow,
  AuthPolicyProps,
  AuthPolicyResult,
  deny,
  response,
} from "@twofold/framework/auth";
import { redirect } from "@twofold/framework/redirect";

/**
 * This is an example of an authentication policy that layouts, pages, actions and routes can optionally use by exporting a 'const auth: AuthPolicyArray = [allowIfCookieSet]'. Non-default auth policies don't have to be specified in this file, but it's a convention so you know where all your authentication code is.
 *
 * Authentication policies exported from layouts, pages, actions and routes by default inherit the authentication policies from their parent layouts and the root authentication policy.
 *
 * If you want a specific route to discard all of it's authentication policies, you can use the special 'reset' value, like so:
 *
 * import { reset } from "@twofold/framework/auth";
 * export const auth: AuthPolicyArray = [reset, otherPolicy];
 *
 * @param props The authentication properties.
 * @returns The policy result.
 */
export async function allowIfCookieSet({
  request,
}: AuthPolicyProps): Promise<AuthPolicyResult> {
  // This is an example of an auth policy that changes it's behaviour based on the request.
  if (cookies.get("allow-access") === "true") {
    return allow();
  } else {
    return deny("missing cookie");
  }
}

export async function behaveBasedOnQueryString({
  request,
}: AuthPolicyProps): Promise<AuthPolicyResult> {
  // This policy changes it's behaviour based on the query string, and is used for the protected/ content under this app (in addition to the other policies here).
  const url = new URL(request.url);
  switch (url.searchParams.get("auth-behaviour")) {
    case "response":
      return response(
        new Response("Access denied by behaveBasedOnQueryString (response)"),
      );
    case "response-throw":
      throw new Response(
        "Access denied by behaveBasedOnQueryString (response-throw).",
      );
    case "deny":
      return deny("Access denied by behaveBasedOnQueryString (deny).");
    case "deny-throw":
      throw "Access denied by behaveBasedOnQueryString (deny-throw).";
    case "error":
      throw new Error(
        "This is an unhandled error for behaveBasedOnQueryString (error).",
      );
    case "redirect":
      redirect("/");
    case "allow":
    default:
      return allow();
  }
}

export async function behaveBasedOnFormData({
  request,
}: AuthPolicyProps): Promise<AuthPolicyResult> {
  // This policy changes it's behaviour based on the 'behaviour' form data, which is how we demonstrate different behaviour for server actions.
  const formData = await request.formData();

  // @note: This is '1_behaviour', due to the way React encodes form data fields. Since you're not expected to actually do auth based on form fields, it's fine as a workaround for the example app.
  switch (formData.get("1_behaviour")) {
    case "response":
      return response(
        new Response("Access denied by behaveBasedOnQueryString (response)"),
      );
    case "response-throw":
      throw new Response(
        "Access denied by behaveBasedOnQueryString (response-throw).",
      );
    case "deny":
      return deny("Access denied by behaveBasedOnQueryString (deny).");
    case "deny-throw":
      throw "Access denied by behaveBasedOnQueryString (deny-throw).";
    case "error":
      throw new Error(
        "This is an unhandled error for behaveBasedOnQueryString (error).",
      );
    case "redirect":
      redirect("/");
    case "allow":
    default:
      return allow();
  }
}

/**
 * The default export from auth.ts is the root authentication policy that applies to all layouts, pages, actions and routes.
 *
 * @param props The authentication properties.
 * @returns The policy result.
 */
export default async function defaultPolicy(
  props: AuthPolicyProps,
): Promise<AuthPolicyResult> {
  // This is the default behaviour when auth.ts is not specified.
  return allow();

  // e.g. deny access with message (message passed to 'access denied' default page)
  //
  // return deny("not signed in");

  // e.g. return a direct response for all but server actions
  //
  // return response(Response.redirect("/", 302));

  // e.g. throwing an error results in deny
  //
  // throw new Error("some message");

  // e.g. throwing a response to return the response
  //
  // throw Response.redirect("/", 302);

  // returning no value is not permitted per the type system, but
  // if you do, it's treated as deny
}
