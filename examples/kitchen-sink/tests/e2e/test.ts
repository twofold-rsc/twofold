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
});

export { expect } from "@playwright/test";
