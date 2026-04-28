import { webcrypto } from "crypto";
import { invariant } from "./utils/invariant.js";
import {
  createFromReadableStream,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";

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

async function encryptString(
  plainText: string,
  password: string,
): Promise<string> {
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

async function decryptString(
  encrypted: string,
  password: string,
): Promise<string> {
  let decoder = new TextDecoder();
  let [iv, cipherText] = encrypted.split(":");
  invariant(iv, "Invalid encrypted text");
  invariant(cipherText, "Invalid encrypted text");
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

async function encode(value: any) {
  let serializationError: unknown;

  let rscStream = renderToReadableStream(value, {}, {});

  let decoder = new TextDecoder();
  let text = "";
  for await (let chunk of rscStream) {
    text += decoder.decode(chunk);
  }

  if (serializationError) {
    throw serializationError;
  }

  return text;
}

async function decode(value: any) {
  let encoder = new TextEncoder();

  let stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(value));
      controller.close();
    },
  });

  return createFromReadableStream(stream, {});
}

export async function encrypt(value: any, key: string) {
  let encoded = await encode(value);
  let encrypted = await encryptString(encoded, key);
  return encrypted;
}

export async function decrypt(value: string, key: string) {
  let decrypted = await decryptString(value, key);
  let decoded = await decode(decrypted);
  return decoded;
}
