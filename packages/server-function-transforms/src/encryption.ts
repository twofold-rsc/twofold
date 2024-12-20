import { webcrypto } from "crypto";

let subtle = webcrypto.subtle;
let algorithm = "AES-GCM";
let ivByteSize = 12;
let format: "base64" | "hex" = "base64";

async function deriveKeyFromString(password: string) {
  let encoder = new TextEncoder();
  let hash = await subtle.digest("SHA-256", encoder.encode(password));
  let key = await subtle.importKey("raw", hash, algorithm, true, [
    "encrypt",
    "decrypt",
  ]);

  return key;
}

export async function encrypt(plainText: string, password: string) {
  let encoder = new TextEncoder();
  let iv = webcrypto.getRandomValues(new Uint8Array(ivByteSize));
  let key = await deriveKeyFromString(password);

  let encrypted = await subtle.encrypt(
    {
      name: algorithm,
      iv: iv,
    },
    key,
    encoder.encode(plainText),
  );

  let ivText = Buffer.from(iv).toString(format);
  let cipherText = Buffer.from(encrypted).toString(format);

  return `${ivText}:${cipherText}`;
}

export async function decrypt(encrypted: string, password: string) {
  let decoder = new TextDecoder();
  let [iv, cipherText] = encrypted.split(":");
  let key = await deriveKeyFromString(password);

  let decrypted = await subtle.decrypt(
    {
      name: algorithm,
      iv: Buffer.from(iv, format),
    },
    key,
    Buffer.from(cipherText, format),
  );

  return decoder.decode(decrypted);
}
