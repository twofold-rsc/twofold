import { test as base } from "../test";
import { waitForBuildError } from "./helpers";

export let test = base.extend<{
  waitForBuildError: (url: string) => Promise<void>;
}>({
  waitForBuildError: async ({ request }, provide) => {
    await provide((url) => waitForBuildError(request, url));
  },
});

export { expect } from "../test";
