import cookies from "@twofold/framework/cookies";
import { Fragment } from "react";

async function setToString() {
  "use server";

  await cookies.encrypted.set("encrypted-cookie", "A string");
}

async function setToObject() {
  "use server";

  let user = {
    id: 123,
    name: "Alice",
    createdAt: new Date(),
  };

  await cookies.encrypted.set("encrypted-cookie", user);
}

async function setToMap() {
  "use server";

  let map = new Map();
  map.set("key1", "value1");
  map.set("key2", "value2");

  await cookies.encrypted.set("encrypted-cookie", map);
}

async function setToPromise() {
  "use server";

  let promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve("Resolved value");
    }, 60);
  });

  await cookies.encrypted.set("encrypted-cookie", promise);
}

async function setToFunction() {
  "use server";

  let func = () => {
    "use server";
    console.log("Function called");
  };

  await cookies.encrypted.set("encrypted-cookie", func);
}

async function runCookieFunction() {
  "use server";

  let func = await cookies.encrypted.get("encrypted-cookie");
  if (typeof func === "function") {
    func();
  }
}

async function destroyCookie() {
  "use server";

  cookies.encrypted.destroy("encrypted-cookie", {
    path: "/",
  });
}

export default async function Page() {
  let encryptedCookie = await cookies.encrypted.get("encrypted-cookie");

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Encrypted cookies
      </h1>
      <div className="mt-6 flex items-center justify-center rounded border-4 border-dashed border-gray-200">
        <div className="flex flex-col items-center py-12">
          <div className="flex items-center justify-center">
            {typeof encryptedCookie === "string" ? (
              <StringCookie value={encryptedCookie} />
            ) : encryptedCookie instanceof Map ? (
              <MapCookie value={encryptedCookie} />
            ) : typeof encryptedCookie === "object" ? (
              <ObjectCookie value={encryptedCookie} />
            ) : typeof encryptedCookie === "function" ? (
              <FunctionCookie />
            ) : (
              <p className="text-sm text-gray-500 italic">Cookie not set</p>
            )}
          </div>
          {encryptedCookie && cookies.get("tfec_encrypted-cookie") && (
            <div className="mt-6 max-w-96 px-8 text-sm break-all text-gray-500">
              {cookies.get("tfec_encrypted-cookie")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="mt-2 flex items-center">
          <form>
            <div className="flex items-center space-x-2">
              <button
                formAction={setToString}
                className="rounded border border-transparent bg-gray-900 px-3.5 py-1 font-medium text-white shadow"
              >
                Set to string
              </button>
              <button
                formAction={setToObject}
                className="rounded border border-transparent bg-gray-900 px-3.5 py-1 font-medium text-white shadow"
              >
                Set to object
              </button>
              <button
                formAction={setToMap}
                className="rounded border border-transparent bg-gray-900 px-3.5 py-1 font-medium text-white shadow"
              >
                Set to map
              </button>
              <button
                formAction={setToPromise}
                className="rounded border border-transparent bg-gray-900 px-3.5 py-1 font-medium text-white shadow"
              >
                Set to promise
              </button>
              <button
                formAction={setToFunction}
                className="rounded border border-transparent bg-gray-900 px-3.5 py-1 font-medium text-white shadow"
              >
                Set to function
              </button>
            </div>
          </form>

          <form action={destroyCookie} className="ml-auto">
            <button
              type="submit"
              className="rounded border border-gray-300 px-3.5 py-1 font-medium shadow hover:bg-gray-50"
            >
              Destroy cookie
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StringCookie({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <p className="text-sm text-gray-500">String</p>
      <p className="text-4xl font-medium">{value}</p>
    </div>
  );
}

function MapCookie({ value }: { value: Map<string, string> }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <p className="text-sm text-gray-500">Map</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {Array.from(value.entries()).map(([key, value]) => (
          <Fragment key={key}>
            <div>{key}</div>
            <div>{value}</div>
          </Fragment>
        ))}
      </div>
      <ul className="space-y-1 text-gray-900"></ul>
    </div>
  );
}

function ObjectCookie({ value }: { value: Record<string, unknown> }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <p className="text-sm text-gray-500">Object</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {Object.entries(value).map(([key, value]) => (
          <Fragment key={key}>
            <div>{key}</div>
            {typeof value === "string" || typeof value === "number" ? (
              <div>{value}</div>
            ) : value instanceof Date ? (
              <div>
                {value.getMonth() + 1}/{value.getDate()}/{value.getFullYear()}
              </div>
            ) : (
              <div>{JSON.stringify(value)}</div>
            )}
          </Fragment>
        ))}
      </div>
      <ul className="space-y-1 text-gray-900"></ul>
    </div>
  );
}

function FunctionCookie() {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-medium">Function</span>
      <form action={runCookieFunction}>
        <button
          type="submit"
          className="mt-2 rounded border border-gray-300 px-3 py-1 font-medium shadow hover:bg-gray-50"
        >
          Run function
        </button>
      </form>
    </div>
  );
}
