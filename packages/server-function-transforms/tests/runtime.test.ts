import { describe, expect, test } from "vitest";
import { encrypt, decrypt } from "../src/runtime";

describe("encrypt and decrypt", () => {
  test("it should encrypt and encode a string, then decrypt and decode it", async () => {
    let encrypted = await encrypt("hello", "password");
    let decrypted = await decrypt(encrypted, "password");

    expect(decrypted).toBe("hello");
  });

  test("it should encrypt and encode an object", async () => {
    let encrypted = await encrypt({ hello: "world" }, "password");
    let decrypted = await decrypt(encrypted, "password");

    expect(decrypted).toEqual({ hello: "world" });
  });

  test("it should error if the wrong key is used", async () => {
    let encrypted = await encrypt({ hello: "world" }, "password");

    await expect(async () => {
      await decrypt(encrypted, "bad-password");
    }).rejects.toThrowError(/operation failed/);
  });

  test("it should be able to encrypt and encode a promise", async () => {
    let promise = new Promise((resolve) => {
      setTimeout(() => resolve("hello"), 100);
    });

    let encrypted = await encrypt(promise, "password");
    let decrypted = await decrypt(encrypted, "password");

    expect(decrypted).toBe("hello");
  });
});
