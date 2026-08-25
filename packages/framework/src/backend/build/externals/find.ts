import { readFile } from "fs/promises";
import { excludePackages, bundlePackages } from "./predefined-externals.js";
import path from "path";
import { createRequire } from "module";
import { fileExists } from "../helpers/file.js";

export async function findExternals(root: URL, ignore: string[]) {
  let require = createRequire(new URL("./package.json", root));
  let dependencies = await getAppDependencies(root);
  let ignoredPackages = new Set([
    ...ignore,
    ...excludePackages,
    ...bundlePackages,
  ]);

  let possibleExternals = dependencies
    .filter((dep) => !dep.startsWith("@types/"))
    .filter((dep) => !ignoredPackages.has(dep));

  let checkPackagesPromise = possibleExternals.map(async (dep) => {
    let needsReact = await dependsOnReact(dep, require);
    return {
      dep,
      isExternal: !needsReact,
    };
  });

  let checkPackages = await Promise.all(checkPackagesPromise);

  return checkPackages
    .filter((check) => check.isExternal)
    .map((data) => data.dep);
}

async function getAppDependencies(root: URL) {
  let packageJsonUrl = new URL("./package.json", root);
  let contents = await readFile(packageJsonUrl, "utf-8");

  try {
    let packageJson = JSON.parse(contents);
    let dependencies = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    });

    return dependencies;
  } catch (error) {
    return [];
  }
}

async function dependsOnReact(dep: string, require: NodeJS.Require) {
  let packageJson = await getDependencyPackageJson(dep, require);
  let nameMatches = packageJson.name === dep;
  let hasReact =
    packageJson.dependencies?.react || packageJson.peerDependencies?.react;
  let answer = !!(nameMatches && hasReact);
  return answer;
}

async function getDependencyPackageJson(dep: string, require: NodeJS.Require) {
  try {
    let entry = require.resolve(dep);
    let currentDir = path.dirname(entry);

    while (currentDir !== path.parse(currentDir).root) {
      let packageJsonPath = path.join(currentDir, "package.json");
      let exists = await fileExists(packageJsonPath);

      if (exists) {
        let contents = await readFile(packageJsonPath, "utf-8");
        let packageJson = JSON.parse(contents);
        return packageJson;
      }

      // recurse up
      currentDir = path.dirname(currentDir);
    }

    return {};
  } catch (error) {
    return {};
  }
}
