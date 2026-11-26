/// <reference types="node" />

import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { EntriesQueueBuilder } from "../../../src/backend/build/builders/entries-queue-builder.ts";
import { withFixture } from "./fixtures.ts";

function appEntries(entries: ReadonlyMap<string, unknown>, sourceRoot: URL) {
  let root = fileURLToPath(sourceRoot);
  return [...entries.keys()]
    .map((id) => path.relative(root, id))
    .filter((id) => !id.startsWith(`..${path.sep}`))
    .map((id) => id.split(path.sep).join("/"));
}

test("discovers a cross-boundary cycle and an independent inline action", async () => {
  await withFixture("cross-boundary", async (sourceRoot) => {
    let builder = new EntriesQueueBuilder();
    let output = await builder.build({ sourceRoot, config: {} });
    expect(appEntries(output.clientComponentEntryMap, sourceRoot)).toEqual([
      "app/components/counter.tsx",
      "app/components/dialog.tsx",
    ]);
    expect(appEntries(output.serverActionEntryMap, sourceRoot)).toEqual([
      "app/actions/save.ts",
      "app/middleware.ts",
    ]);
  });
});

test("follows the RSC and browser exports in their respective scans", async () => {
  await withFixture("conditional-exports", async (sourceRoot) => {
    let output = await new EntriesQueueBuilder().build({ sourceRoot, config: {} });
    expect(appEntries(output.clientComponentEntryMap, sourceRoot)).toEqual([
      "app/shell.tsx",
      "node_modules/entry-variants/panel.js",
    ]);
    expect(appEntries(output.serverActionEntryMap, sourceRoot)).toEqual([
      "node_modules/entry-variants/save.js",
    ]);
  });
});

test("discovers server actions when the source merely mentions use client", async () => {
  await withFixture("directive-mentions", async (sourceRoot) => {
    let entries = await new EntriesQueueBuilder().build({ sourceRoot, config: {} });
    expect(appEntries(entries.clientComponentEntryMap, sourceRoot)).toEqual([]);
    expect(appEntries(entries.serverActionEntryMap, sourceRoot)).toEqual([
      "app/actions/save.ts",
      "app/pages/index.page.tsx",
    ]);
  });
});
