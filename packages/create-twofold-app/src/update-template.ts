import { mkdir, readdir, lstat, copyFile, rm } from "fs/promises";
import { pathToFileURL } from "node:url";
import path from "path";
import { fileURLToPath } from "url";
import { remapped } from "./remapped.js";

let ignored = ["node_modules", ".twofold", "CHANGELOG.md"];

let cwd = pathToFileURL(process.cwd());

let cwdUrl = new URL(`${cwd}/`);
let templateDir = new URL("./template/", cwdUrl);
let examplesDir = new URL("../../examples/", cwdUrl);
let baseAppDir = new URL("./base-app", examplesDir);

function destinationFile<K extends keyof typeof remapped>(key: K) {
  return remapped[key] ?? key;
}

async function copy(source: string, destination: string) {
  try {
    await mkdir(destination, { recursive: true });

    let files = await readdir(source);

    await Promise.all(
      files
        .filter((file) => !ignored.includes(file))
        .map(async (file) => {
          let sourcePath = path.join(source, file);
          let destinationPath = path.join(destination, destinationFile(file));
          let stats = await lstat(sourcePath);

          if (stats.isDirectory()) {
            await copy(sourcePath, destinationPath);
          } else {
            await copyFile(sourcePath, destinationPath);
            console.log(
              `*** ${source.slice(fileURLToPath(examplesDir).length)}/${file}`
            );
          }
        })
    );
  } catch (err) {
    console.error("Error copying directory:", err);
  }
}

let sourceDirectory = fileURLToPath(baseAppDir);
let destinationDirectory = fileURLToPath(templateDir);

async function main() {
  await rm(destinationDirectory, { recursive: true, force: true });
  await copy(sourceDirectory, destinationDirectory);
  console.log("Template updated successfully!");
}

main();
