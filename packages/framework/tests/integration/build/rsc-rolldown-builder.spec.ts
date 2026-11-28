/// <reference types="node" />

import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "vitest";
import { EntriesQueueBuilder, EntriesQueueOutput } from "../../../src/backend/build/builders/entries-queue-builder.ts";
import { RSCRolldownBuilder } from "../../../src/backend/build/builders/rsc-rolldown-builder.ts";
import { excludePackages } from "../../../src/backend/build/externals/predefined-externals.ts";
import { getModuleId } from "../../../src/backend/build/helpers/module.ts";
import { withFixture } from "./fixtures.ts";

test("registers server actions when the source merely mentions use client", async () => {
  await withFixture("directive-mentions", async (sourceRoot) => {
    let actionPaths = ["app/actions/save.ts", "app/pages/index.page.tsx"].map(
      (file) => fileURLToPath(new URL(file, sourceRoot)),
    );
    let entries = new EntriesQueueOutput({
      sourceRoot,
      externalPackages: excludePackages,
      clientComponentEntryMap: new Map(),
      serverActionEntryMap: new Map(
        actionPaths.map((path) => [path, { path, moduleId: getModuleId(path) }]),
      ),
    });

    let rsc = await new RSCRolldownBuilder().build({
      environment: "development",
      entries,
    });

    expect([...rsc.serverActionMap.values()].map((action) => action.moduleId).sort()).toEqual(
      actionPaths.map(getModuleId).sort(),
    );
  });
});

test("exposes only registered action exports from a page's action module", async () => {
  await withFixture("action-module-exports", async (sourceRoot) => {
    let entries = await new EntriesQueueBuilder().build({ sourceRoot, config: {} });
    let rsc = await new RSCRolldownBuilder().build({ environment: "development", entries });
    let pagePath = fileURLToPath(new URL("app/pages/index.page.tsx", sourceRoot));
    let moduleId = getModuleId(pagePath);
    let actionExports = [...rsc.serverActionMap.values()]
      .filter((action) => action.moduleId === moduleId)
      .map((action) => action.export);
    expect(actionExports).toHaveLength(1);

    let entry = rsc.serverActionModuleMap[moduleId];
    if (!entry) {
      throw new Error("Expected an action module for the fixture page");
    }

    // Import the emitted module under the same React condition as the app server.
    let stdout = execFileSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--input-type=module",
        "--eval",
        "console.log(JSON.stringify(Object.keys(await import(process.argv[1])).sort()));",
        pathToFileURL(entry.path).href,
      ],
      { encoding: "utf8" },
    );
    expect(JSON.parse(stdout)).toEqual(actionExports.sort());
  });
});
