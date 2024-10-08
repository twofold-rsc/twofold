import { createJiti } from "jiti";
import { appConfigDir } from "../../files.js";

let jiti = createJiti(import.meta.url, {
  debug: false,
  moduleCache: false,
});

export async function getAppConfig() {
  let appConfigFileUrl = new URL("./application.ts", appConfigDir);
  let configMod: any = await jiti.import(appConfigFileUrl.href);
  return configMod.default ?? {};
}
