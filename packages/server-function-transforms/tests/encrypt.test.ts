import { expect, test, describe } from "vitest";
import { encrypt, decrypt } from "../src/encryption";

describe("encryption", () => {
  test("it should be able to encrypt and decrypt text", async () => {
    let password = "password123";
    let encrypted = await encrypt("Hello world!", password);
    let decrypted = await decrypt(encrypted, password);

    expect(encrypted).not.toBe("Hello world!");
    expect(decrypted).toBe("Hello world!");
  });

  test("it should fail if the encryption key is incorrect", async () => {
    let encrypted = await encrypt("Hello world!", "abc123");

    await expect(async () => {
      await decrypt(encrypted, "xyz456");
    }).rejects.toThrowError(/The operation failed/);
  });

  test("it should not produce the same output for the same input", async () => {
    let password = "password123";
    let encrypted1 = await encrypt("Hello world!", password);
    let encrypted2 = await encrypt("Hello world!", password);

    expect(encrypted1).not.toBe(encrypted2);
  });
});
