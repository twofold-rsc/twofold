import type { APIRequestContext } from "@playwright/test";
import { expect } from "../test";

export async function waitForBuildError(
  request: APIRequestContext,
  url: string,
) {
  await expect
    .poll(
      async () => {
        let response = await request.get(url, {
          headers: { Accept: "text/html" },
          timeout: 1_500,
        });
        let html = await response.text();
        return {
          status: response.status(),
          isErrorPage: html.includes('data-testid="error-page"'),
        };
      },
      {
        message: `Wait for ${url} to serve a build error`,
        timeout: 3_000,
      },
    )
    .toEqual({ status: 500, isErrorPage: true });
}

export function enableBuildErrors(source: string) {
  return source
    .replace(/(\/\/ build-error-on\n)(\s*)\/\/ ?([^\n]*)/g, "$1$2$3")
    .replace(/(\/\/ build-error-off\n)(\s*)(?!\/\/)([^\n]*)/g, "$1$2// $3")
    .replace(
      /(\{\/\* build-error-on \*\/\}\n)(\s*)\{\/\* ?([^\n]*) \*\/\}/g,
      "$1$2$3",
    );
}

export function disableBuildErrors(source: string) {
  return source
    .replace(/(\/\/ build-error-on\n)(\s*)(?!\/\/)([^\n]*)/g, "$1$2// $3")
    .replace(/(\/\/ build-error-off\n)(\s*)\/\/ ?([^\n]*)/g, "$1$2$3")
    .replace(
      /(\{\/\* build-error-on \*\/\}\n)(\s*)(?!\{\/\*)([^\n]*)/g,
      "$1$2{/* $3 */}",
    );
}
