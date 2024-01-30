import prompts from "prompts";

// ask for app name

// verify pnpm exists

// publish release with base-app

// get latest version of mono repo

// download .tar.gz source and extract base app

// edit app name in package.json

// pnpm install

async function main() {
  let response = await prompts({
    type: "text",
    name: "appName",
    message: "What is the name of your app?",
  });

  console.log(response.appName);
}

main();
