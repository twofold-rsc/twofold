import { PathLike, createReadStream } from "fs";

export async function readFirstNBytes(path: PathLike, n: number) {
  const chunks = [];
  for await (let chunk of createReadStream(path, { start: 0, end: n - 1 })) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
