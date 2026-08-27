import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { afterEach, describe, expect, test } from "vitest";
import {
  appCompiledDir,
  frameworkSrcDir,
} from "../../../../src/backend/files.ts";
import { ClientOutput } from "../../../../src/backend/build/v2/builders/client-builder.ts";
import {
  EntriesBuilder,
  EntriesOutput,
} from "../../../../src/backend/build/v2/builders/entries-builder.ts";
import { StaticFilesBuilder } from "../../../../src/backend/build/v2/builders/static-files-builder.ts";

let temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
  temporaryDirectories = [];
});

describe("v2 builder source root", () => {
  test("normalizes and serializes the entries source root", async () => {
    let sourcePath = await createTemporaryDirectory();
    let entries = createEntriesOutput(pathToFileURL(sourcePath));
    let expectedRoot = pathToFileURL(`${sourcePath}${path.sep}`);

    expect(entries.sourceRoot.href).toBe(expectedRoot.href);

    let loadedEntries = new EntriesBuilder().load(entries.serialize());
    expect(loadedEntries.sourceRoot.href).toBe(expectedRoot.href);
  });

  test("finds public files relative to the entries source root", async () => {
    let sourcePath = await createTemporaryDirectory();
    let publicPath = path.join(sourcePath, "public", "nested");
    await mkdir(publicPath, { recursive: true });
    await writeFile(path.join(publicPath, "example.txt"), "example");

    let entries = createEntriesOutput(pathToFileURL(sourcePath));
    let output = await new StaticFilesBuilder().build({ entries });

    expect(Array.from(output.fileMap.keys())).toEqual(["/nested/example.txt"]);
  });

  test("resolves client output from appCompiledDir", () => {
    let sourcePath = fileURLToPath(
      new URL(
        "./client/apps/client/browser/initialize-browser.tsx",
        frameworkSrcDir,
      ),
    );
    let fileName = "entries/initialize-browser-example.js";
    let output = new ClientOutput({
      outputs: [{ fileName, facadeModuleId: sourcePath, exports: [] }],
      clientComponentEntryMap: new Map(),
      imagesMap: new Map(),
    });

    expect(output.bootstrapPath).toBe(
      fileURLToPath(new URL(`./client/${fileName}`, appCompiledDir)),
    );
  });
});

async function createTemporaryDirectory() {
  let directory = await mkdtemp(path.join(tmpdir(), "twofold-v2-builders-"));
  temporaryDirectories.push(directory);
  return directory;
}

function createEntriesOutput(sourceRoot: URL) {
  return new EntriesOutput({
    sourceRoot,
    clientComponentEntryMap: new Map(),
    serverActionEntryMap: new Map(),
    externalPackages: [],
  });
}
