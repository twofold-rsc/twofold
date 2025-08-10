"use server";

import os from "node:os";
import { execSync } from "child_process";

export async function reducer(prev: string | null, action: string) {
  if (action === "os.freemem") {
    return `The server has ${convertToMB(os.freemem())} MB of free memory`;
  } else if (action === "new Date()") {
    return `The server date is ${new Date().toLocaleString()}`;
  } else if (action === "uptime") {
    return `The server has been online for ${uptime()}`;
  } else {
    return prev;
  }
}

function convertToMB(bytes: number) {
  return Math.floor(bytes / (1024 * 1024));
}

function uptime() {
  try {
    const uptimeOutput = execSync("uptime").toString();

    const daysMatch = uptimeOutput.match(/up\s+(\d+)\s+days?/);
    if (daysMatch) {
      return `${daysMatch[1]} days`;
    }

    const hoursMatch =
      uptimeOutput.match(/up\s+(\d+):(\d+)/) ||
      uptimeOutput.match(/up\s+(\d+)\s+hrs?/);
    if (hoursMatch) {
      const hours = hoursMatch[1];
      return `${hours} hours`;
    }

    const minutesMatch = uptimeOutput.match(/up\s+(\d+)\s+mins?/);
    if (minutesMatch) {
      return `${minutesMatch[1]} minutes`;
    }

    return "less than 1 minute";
  } catch (error) {
    return "10 days";
  }
}
