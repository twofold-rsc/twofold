/// <reference types="node" />

import { cp, mkdir, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

let require = createRequire(import.meta.url);
let fixtures = new URL("../../fixtures/apps/", import.meta.url);

export async function withFixture(
  name: string,
  run: (sourceRoot: URL) => Promise<void>,
) {
  let dir = await mkdtemp(path.join(await realpath(tmpdir()), "twofold-build-"));
  try {
    let fixture = new URL(`${name}/`, fixtures);
    await cp(new URL("app/", fixture), path.join(dir, "app"), {
      recursive: true,
    });
    await cp(new URL("package.json", fixture), path.join(dir, "package.json"));
    let modules = path.join(dir, "node_modules");
    await mkdir(modules);
    for (let pkg of ["react", "react-server-dom-webpack"]) {
      await symlink(
        path.dirname(require.resolve(`${pkg}/package.json`)),
        path.join(modules, pkg),
        "junction",
      );
    }
    if (name === "conditional-exports") {
      await cp(
        new URL("entry-variants/", fixture),
        path.join(modules, "entry-variants"),
        { recursive: true },
      );
    }
    await run(pathToFileURL(`${dir}${path.sep}`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
