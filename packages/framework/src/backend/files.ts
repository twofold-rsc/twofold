import { pathToFileURL } from "node:url";

let cwd = pathToFileURL(process.cwd());

export const cwdUrl = new URL(`${cwd}/`);
export const appSrcDir = new URL("./src/", cwdUrl);
export const appCompiledDir = new URL("./.twofold/", cwdUrl);

export const frameworkSrcDir = new URL("../../src/", import.meta.url);
