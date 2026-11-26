import { check as checkClientModule } from "@twofold/client-component-transforms";
import { check as checkServerModule } from "@twofold/server-function-transforms";
import { shouldIgnoreUseClient, shouldIgnoreUseServer } from "./excluded.js";

export async function getRscDirective(
  id: string,
  options: Parameters<typeof checkClientModule>[0],
) {
  let { code } = options.input;
  let maybeClient = code.includes("use client") && !shouldIgnoreUseClient(id);
  let maybeServer = code.includes("use server") && !shouldIgnoreUseServer(id);

  if (maybeClient && (await checkClientModule(options))) {
    return "client";
  }

  if (maybeServer && (await checkServerModule(options))) {
    return "server";
  }
}
