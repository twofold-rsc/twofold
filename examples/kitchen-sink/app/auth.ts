import {
  AuthPolicyProps,
  AuthPolicyResult,
  allow,
} from "@twofold/framework/auth";

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
