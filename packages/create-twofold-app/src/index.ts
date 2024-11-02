import { access, mkdir, readFile, rename, writeFile } from "fs/promises";
import prompts from "prompts";
import signale from "signale";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { ReadableStream } from "stream/web";
import { fileURLToPath, pathToFileURL } from "url";
import * as tar from "tar";
import { remapped } from "./remapped.js";
import * as childProcess from "child_process";
import util from "util";
import { parse } from "yaml";
let exec = util.promisify(childProcess.exec);

async function main() {
  // verify pnpm exists
  let npmUserAgent = process.env.npm_config_user_agent;
  if (
    !npmUserAgent ||
    typeof npmUserAgent !== "string" ||
    !npmUserAgent.includes("pnpm")
  ) {
    signale.error("You must use pnpm to create a new app:");
    signale.error("$ pnpm create twofold-app@latest");
    process.exit(1);
  }

  let [agentVersion] = npmUserAgent.split(/\s/);
  let [_, versionString] = agentVersion.split(/\//);
  let pnpmVersion = versionString.split(".").map(Number);
  let hasRequiredPnpmVersion = pnpmVersion[0] >= 9;
  if (!hasRequiredPnpmVersion) {
    signale.error(
      "You must use pnpm version 9.0.0 or higher to create a new app.",
    );
    process.exit(1);
  }

  // verify node version
  let nodeVersion = process.versions.node.split(".").map(Number);
  let hasRequiredNodeVersion =
    nodeVersion[0] > 20 ||
    (nodeVersion[0] === 20 &&
      (nodeVersion[1] > 9 || (nodeVersion[1] === 9 && nodeVersion[2] >= 0)));

  if (!hasRequiredNodeVersion) {
    signale.error(
      "You must use Node.js version 20.9.0 or higher to create a new app.",
    );
    process.exit(1);
  }

  // check for git
  let hasGit = false;
  try {
    await exec("git --version");
    hasGit = true;
  } catch (e) {
    hasGit = false;
  }

  signale.info("Welcome to the Twofold app generator!");

  // get app name
  let response = await prompts({
    type: "text",
    name: "appName",
    message: "What is the name of your app?",
  });

  let appName = response.appName;

  if (!appName || typeof appName !== "string") {
    signale.error("Invalid app name");
    process.exit(1);
  }

  let appFolderName = appName.toLowerCase().replace(/\s/g, "-");

  let cwd = pathToFileURL(process.cwd());
  let cwdUrl = new URL(`${cwd}/`);

  let rootUrl = cwdUrl;
  // let rootUrl = pathToFileURL(os.tmpdir());

  let appUrl = new URL(`./${appFolderName}/`, rootUrl);
  let appPath = fileURLToPath(appUrl);

  // make sure app folder doesn't exist
  let appUrlExists = false;
  try {
    await access(appUrl);
    appUrlExists = true;
  } catch (error) {
    appUrlExists = false;
  }

  if (appUrlExists) {
    signale.error(
      `Folder ${appFolderName} already exists. Please choose another name.`,
    );
    process.exit(1);
  }

  signale.pending("Setting up a new Twofold app...");

  // find the latest version of twofold from github
  let latestResp = await fetch(
    "https://api.github.com/repos/twofold-rsc/twofold/releases/latest",
  );
  let latestJson = await latestResp.json();

  let downloadUrl = latestJson["tarball_url"];
  let version = latestJson["tag_name"].startsWith("v")
    ? latestJson["tag_name"].slice(1)
    : latestJson["tag_name"];

  if (!downloadUrl || typeof downloadUrl !== "string") {
    signale.error("Failed to find latest release.");
    process.exit(1);
  }

  // download the latest release
  let res = await fetch(downloadUrl);

  if (!res.body) {
    signale.error("Failed to download latest release");
    process.exit(1);
  }

  let [fetchStream1, fetchStream2] = res.body.tee();

  let downloadStream1 = Readable.fromWeb(fetchStream1 as ReadableStream);
  let downloadStream2 = Readable.fromWeb(fetchStream2 as ReadableStream);

  await mkdir(appUrl, { recursive: true });

  // extract the template app
  await pipeline(
    downloadStream1,
    tar.x({
      cwd: appPath,
      strip: 4, // github-repo-name-folder/packages/create-twofold-app/template
      filter: (path) => {
        let parts = path.split("/");
        let keep =
          parts[1] === "packages" &&
          parts[2] === "create-twofold-app" &&
          parts[3] === "template" &&
          parts[4]
            ? true
            : false;
        return keep;
      },
    }),
  );

  // get catalog versions
  let resolveCatalog: (catalog: any) => void;
  let catalogVersions = new Promise<any>((resolve) => {
    resolveCatalog = resolve;
  });

  await pipeline(
    downloadStream2,
    tar.t({
      filter(path) {
        let parts = path.split("/");
        return parts[1] === "pnpm-workspace.yaml";
      },
      async onentry(entry) {
        let buf = await entry.concat();
        let content = parse(buf.toString());
        resolveCatalog(content.catalog);
      },
    }),
  );

  let catalog = await catalogVersions;

  // rename any remapped files
  for (let file of Object.keys(remapped)) {
    let oldName = remapped[file];
    let newName = file;
    await rename(
      new URL(`./${oldName}`, appUrl),
      new URL(`./${newName}`, appUrl),
    );
  }

  // edit package.json
  let json = await readFile(new URL("./package.json", appUrl), "utf8");
  let pkg = JSON.parse(json);
  pkg.name = appName;
  pkg.version = "0.0.1";

  // remap versions
  let versions: Record<any, any> = {
    ...catalog,
    "eslint-plugin-twofold": `${version}`,
    "@twofold/framework": `${version}`,
  };

  function modifyVersions(deps: Record<string, string>) {
    for (let dep of Object.keys(deps)) {
      if (versions[dep] && typeof versions[dep] === "string") {
        deps[dep] = versions[dep];
      }
    }
  }

  modifyVersions(pkg.dependencies);
  modifyVersions(pkg.devDependencies);

  let newPackage = JSON.stringify(pkg, null, 2);
  await writeFile(new URL("./package.json", appUrl), newPackage);

  signale.complete("App created!");

  signale.pending("Installing dependencies. This may take a minute...");

  try {
    let { stderr } = await exec(`pnpm install`, {
      cwd: appPath,
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    });

    if (stderr) {
      throw new Error(stderr);
    }
  } catch (e) {
    signale.error("Failed to install dependencies");
    console.log(e);
    process.exit(1);
  }

  signale.complete("Dependencies installed!");

  // git init/comment
  if (hasGit) {
    signale.pending("Initializing git repository...");
    await exec("git init", { cwd: appPath });
    await exec("git checkout -b main", { cwd: appPath });
    await exec("git add .", { cwd: appPath });
    await exec("git commit -m 'Initial commit'", { cwd: appPath });
    signale.complete("Git repository created!");
  }

  signale.success("All set!");
  signale.info(`App installed at: ${appPath}`);
  signale.info(`Run app: cd ${appFolderName} && pnpm dev`);
}

main();
