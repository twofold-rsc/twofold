import { expect, test as base } from "@playwright/test";

declare global {
  interface Window {
    __twofold?: WindowTwofold | undefined;
  }

  interface WindowTwofold {
    clientAppIsInteractive?: boolean;
  }
}

export let test = base.extend<{
  verifyNoErrors: () => void;
  waitForBuildError: (url: string) => Promise<void>;
}>({
  page: async ({ page, javaScriptEnabled }, provide) => {
    async function waitForClientApp() {
      if (javaScriptEnabled) {
        await page.waitForFunction(
          () =>
            window.__twofold?.clientAppIsInteractive === true ||
            document.documentElement.dataset.testid === "error-page",
        );
      }
    }

    let goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      let response = await goto(url, options);
      await waitForClientApp();
      return response;
    };

    let reload = page.reload.bind(page);
    page.reload = async (options) => {
      let response = await reload(options);
      await waitForClientApp();
      return response;
    };

    await provide(page);
  },
  verifyNoErrors: async ({ page }, provide) => {
    let errors: string[] = [];

    let onPageError = (error: Error) => errors.push(error.message);
    let onConsole = (message: { type(): string; text(): string }) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    };

    page.on("pageerror", onPageError);
    page.on("console", onConsole);

    try {
      await provide(() => expect(errors).toEqual([]));
    } finally {
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
    }
  },
  waitForBuildError: async ({ request }, provide) => {
    await provide(async (url) => {
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
    });
  },
});

export { expect } from "@playwright/test";
