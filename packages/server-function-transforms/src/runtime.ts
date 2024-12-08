import * as serialization from "./serialization.js";
import * as encryption from "./encryption.js";

export async function encrypt(value: any, key: string) {
  let encoded = await serialization.encode(value);
  let encrypted = await encryption.encrypt(encoded, key);
  return encrypted;
}

export async function decrypt(value: string, key: string) {
  let decrypted = await encryption.decrypt(value, key);
  let decoded = await serialization.decode(decrypted);
  return decoded;
}
