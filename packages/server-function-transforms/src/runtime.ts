import * as encryption from "./encryption.js";
import { parse, stringifyAsync } from "devalue";

export async function encrypt(value: any, key: string) {
  let encoded = await stringifyAsync(value);
  let encrypted = await encryption.encrypt(encoded, key);
  return encrypted;
}

export async function decrypt(value: string, key: string) {
  let decrypted = await encryption.decrypt(value, key);
  let decoded = parse(decrypted);
  return decoded;
}
