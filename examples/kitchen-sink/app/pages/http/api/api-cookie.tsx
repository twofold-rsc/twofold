"use client";

import { useState } from "react";

export function APICookie() {
  let [cookie, setCookie] = useState("");

  async function create() {
    let formData = new FormData();
    if (typeof cookie === "string") {
      formData.append("value", cookie);
    }

    await fetch("/http/api/cookies", {
      method: "post",
      body: formData,
    });
  }

  async function destroy() {
    await fetch("/http/api/cookies", {
      method: "delete",
    });

    setCookie("");
  }

  async function read() {
    let response = await fetch("/http/api/cookies");
    let json = await response.json();

    setCookie(json.value ?? "");
  }

  return (
    <div>
      <form className="mt-4">
        <div>
          <input
            type="text"
            name="value"
            value={cookie}
            onChange={(event) => setCookie(event.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5"
            placeholder="Cookie value"
          />
        </div>
        <div className="mt-3 flex items-center space-x-2">
          <button
            type="button"
            className="rounded bg-gray-100 px-4 py-2 text-black"
            onClick={destroy}
          >
            Destroy
          </button>
          <button
            type="button"
            className="rounded bg-blue-500 px-4 py-2 text-white"
            onClick={read}
          >
            Fetch
          </button>
          <button
            type="button"
            className="rounded bg-blue-500 px-4 py-2 text-white"
            onClick={create}
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}
