/// <reference types="node" />

import { cp, mkdir, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "vitest";
import { EntriesQueueBuilder } from "../../../src/backend/build/builders/entries-queue-builder.ts";

let require = createRequire(import.meta.url);
let fixtures = new URL("../../fixtures/entries-queue/", import.meta.url);

async function withFixture(
  name: string,
  run: (sourceRoot: URL) => Promise<void>,
) {
  let dir = await mkdtemp(path.join(await realpath(tmpdir()), "entries-queue-"));
  try {
    let fixture = new URL(`${name}/`, fixtures);
    await cp(new URL("app/", fixture), path.join(dir, "app"), {
      recursive: true,
    });
    await cp(new URL("package.json", fixture), path.join(dir, "package.json"));
    let modules = path.join(dir, "node_modules");
    await mkdir(modules);
    await symlink(
      path.dirname(require.resolve("react-server-dom-webpack/package.json")),
      path.join(modules, "react-server-dom-webpack"),
      "junction",
    );
    if (name === "conditional-exports") {
      await cp(
        new URL("entry-variants/", fixture),
        path.join(modules, "entry-variants"),
        {
          recursive: true,
        },
      );
    }
    await run(pathToFileURL(`${dir}${path.sep}`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

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
