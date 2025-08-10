"use server";

import os from "node:os";
import { execSync } from "child_process";
import { readFile } from "node:fs/promises";

export async function reducer(prev: string | null, action: string) {
  if (action === "os.freemem") {
    return `${convertToMB(os.freemem())} MB of free memory`;
  } else if (action === "new Date()") {
    return `It's ${new Date().toLocaleString()}`;
  } else if (action === "/proc/uptime") {
    let result = await uptime();
    return `Online for ${result}`;
  } else {
    return prev;
  }
}

function convertToMB(bytes: number) {
  return Math.floor(bytes / (1024 * 1024));
}

async function uptime() {
  try {
    const raw = await readFile("/proc/uptime", "utf8");
    const first = raw.trim().split(/\s+/)[0];
    const seconds = Math.floor(Number(first));

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days === 0 && hours === 0 && minutes === 0) {
      return "less than a minute";
    }

    if (days === 0 && hours === 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    if (days === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    return `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  } catch (error) {
    return "10 days 4 hours";
  }
}
