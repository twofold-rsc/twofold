import { Plugin } from "esbuild";
import { createRequire } from "module";
import { cwdUrl } from "../../files.js";
import { readFile } from "fs/promises";
import { bundlePackages, externalPackages } from "../packages.js";
import path from "path";
import { fileExists } from "../helpers/file.js";

// this plugin exists to discover packages and imports that
// can be external in an rsc environment.

let require = createRequire(import.meta.url);

export function externalsPlugin({
  userDefinedExternalPackages,
  onEnd,
}: {
  userDefinedExternalPackages: string[];
  onEnd: (discoveredExternals: Set<string>) => void;
}): Plugin {
  return {
    name: "externals-plugin",
    async setup(build) {
      let dependencies = await getAppDependencies();

      let knownExternals = new Set([
        ...externalPackages,
        ...userDefinedExternalPackages,
      ]);
      let knownBundle = new Set<string>(bundlePackages);

      let possibleExternals = dependencies
        .filter((dep) => !knownExternals.has(dep))
        .filter((dep) => !knownBundle.has(dep));

      let discoveredExternals = new Set<string>();

      build.onResolve({ filter: /\.*$/ }, async ({ path }) => {
        if (discoveredExternals.has(path)) {
          return {
            path,
            external: true,
          };
        }

        if (
          !path.startsWith("./") &&
          !path.startsWith("../") &&
          possibleExternals.some(
            (dep) => path === dep || path.startsWith(`${dep}/`)
          )
        ) {
          let resolvePath = require.resolve(path);
          let isPackage = resolvePath.includes("node_modules");
          if (isPackage) {
            let shouldBundle = await dependsOnReact(path);
            if (!shouldBundle) {
              discoveredExternals.add(path);
              return {
                path,
                external: true,
              };
            }
          }
        }
      });

      build.onEnd(() => {
        // console.log("Discovered Externals", discoveredExternals);
        onEnd(discoveredExternals);
      });
    },
  };
}

async function getAppDependencies() {
  let packageJsonUrl = new URL("./package.json", cwdUrl);
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

async function dependsOnReact(dep: string) {
  let packageJson = await getDependencyPackageJson(dep);
  let nameMatches = packageJson.name === dep;
  let hasReact =
    packageJson.dependencies?.react || packageJson.peerDependencies?.react;
  return !!(nameMatches && hasReact);
}

async function getDependencyPackageJson(dep: string) {
  try {
    let entry = require.resolve(dep);
    let currentDir = path.dirname(entry);

    while (currentDir !== path.parse(currentDir).root) {
      let packageJsonPath = path.join(currentDir, "package.json");
      let exists = await fileExists(packageJsonPath);

      if (exists) {
        let contents = await readFile(packageJsonPath, "utf-8");
        return JSON.parse(contents);
      }

      // recurse up
      currentDir = path.dirname(currentDir);
    }

    return {};
  } catch (error) {
    return {};
  }
}
