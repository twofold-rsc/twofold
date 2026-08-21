import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { expect, test } from "../test";

let execFileAsync = promisify(execFile);

function enableLintErrors(source: string) {
  return source
    .replace(/(\/\/ lint-error-on\n)(\s*)\/\/ ?([^\n]*)/g, "$1$2$3")
    .replace(/(\/\/ lint-error-off\n)(\s*)(?!\/\/)([^\n]*)/g, "$1$2// $3");
}

test(
  "reports lint errors in React components",
  { tag: "@build" },
  async ({ page }) => {
    let fileUrl = new URL(
      "../../../app/pages/react/lint/client.tsx",
      import.meta.url,
    );
    let source = await readFile(fileUrl, "utf8");
    let brokenSource = enableLintErrors(source);
    let sourceChanged = false;

    expect(brokenSource).not.toBe(source);

    await page.goto("/react/lint");
    let lintOutput = page.getByTestId("lint-output");
    await expect(lintOutput).toHaveText("hello world");

    try {
      await writeFile(fileUrl, brokenSource);
      sourceChanged = true;

      await expect(lintOutput).toHaveText("1", { timeout: 15_000 });

      let lintError = await execFileAsync("pnpm", ["lint"]).catch(
        (error) => error,
      );

      expect(lintError).toMatchObject({
        code: 1,
      });
      expect(lintError.stdout).toContain("react(refs)");
      expect(lintError.stdout).toContain("react-hooks(exhaustive-deps)");
    } finally {
      await writeFile(fileUrl, source);
      if (sourceChanged) {
        await expect(lintOutput).toHaveText("hello world", {
          timeout: 15_000,
        });
      }
    }
  },
);
