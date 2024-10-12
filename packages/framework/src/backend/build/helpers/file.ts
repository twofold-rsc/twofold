import { PathLike, createReadStream } from "fs";
import { stat } from "fs/promises";

export async function readFirstNBytes(path: PathLike, n: number) {
  const chunks = [];
  for await (let chunk of createReadStream(path, { start: 0, end: n - 1 })) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function fileExists(path: PathLike) {
  try {
    let stats = await stat(path);
    return stats.isFile();
  } catch (_e) {
    return false;
  }
}
