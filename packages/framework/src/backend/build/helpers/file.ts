import { PathLike, createReadStream } from "fs";
import { readFile, stat } from "fs/promises";
import xxhash from "xxhash-wasm";

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

export async function hashFile(path: string) {
  let { h64Raw } = await xxhash();
  let buffer = await readFile(path);
  let hash = h64Raw(buffer);
  return hash.toString(16);
}
