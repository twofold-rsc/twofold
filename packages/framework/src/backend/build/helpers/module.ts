import { createHash } from "crypto";
import { basename, extname } from "path";

export function getModuleId(path: string) {
  let md5 = createHash("md5").update(path).digest("hex");
  let name = basename(path, extname(path));
  let moduleId = `${name}-${md5}`;
  return moduleId;
}
