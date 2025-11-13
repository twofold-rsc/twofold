import { fileURLToPath, pathToFileURL } from "node:url";

export const cwd = process.cwd();

export const cwdUrl = new URL(`${pathToFileURL(cwd)}/`);
export const appAppDir = new URL("./app/", cwdUrl);
export const appConfigDir = new URL("./config/", cwdUrl);
export const appCompiledDir = new URL("./.twofold/", cwdUrl);

export const frameworkCompiledDir = new URL("../../dist/", import.meta.url);
export const frameworkSrcDir = new URL("../../src/", import.meta.url);
