import { describe, expect, test } from "vitest";
import { encode, decode } from "../src/serialization";

describe("serialization", () => {
  test("it should be able to serialize a string", async () => {
    let serialized = await encode("Hello world!");

    expect(serialized).toMatchInlineSnapshot(`
      "0:"Hello world!"
      "
    `);
  });

  test("it should be able to serialize an object", async () => {
    let serialized = await encode({ hello: "world" });

    expect(serialized).toMatchInlineSnapshot(`
      "0:{"hello":"world"}
      "
    `);
  });

  test("it should serialize and deserialize a string", async () => {
    let serialized = await encode("Hello world!");
    let deserialized = await decode(serialized);

    expect(deserialized).toBe("Hello world!");
  });

  test("it should serialize and deserialize an object", async () => {
    let serialized = await encode({ hello: "world" });
    let deserialized = await decode(serialized);

    expect(deserialized).toEqual({ hello: "world" });
  });

  test("it should not be able to serialize a function", async () => {
    let originalError = console.error;
    console.error = () => {};

    await expect(async () => {
      await encode(() => {
        console.log("hello");
      });
    }).rejects.toThrowError();

    console.error = originalError;
  });
});
