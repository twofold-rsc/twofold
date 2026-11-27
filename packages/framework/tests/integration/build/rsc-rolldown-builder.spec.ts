/// <reference types="node" />

import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { EntriesQueueOutput } from "../../../src/backend/build/builders/entries-queue-builder.ts";
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
