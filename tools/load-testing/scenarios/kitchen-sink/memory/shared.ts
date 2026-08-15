import { check, sleep } from "k6";
import http from "k6/http";
import { Gauge } from "k6/metrics";
import type { Options } from "k6/options";

export const baseUrl = "http://localhost:3000";

const batches = 50;
const requestsPerBatch = Number(__ENV.BATCH_SIZE ?? 500);
const sampleLabelWidth = `batch-${batches}`.length;

const rss = new Gauge("server_rss_bytes");
const heapTotal = new Gauge("server_heap_total_bytes");
const heapUsed = new Gauge("server_heap_used_bytes");
const external = new Gauge("server_external_bytes");
const arrayBuffers = new Gauge("server_array_buffers_bytes");

type MemoryUsage = {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
};

export const options: Options = {
  scenarios: {
    default: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "20m",
    },
  },
  discardResponseBodies: true,
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
  },
};

export function createMemoryTest(request: () => void) {
  return function memoryTest() {
    for (let iteration = 0; iteration < requestsPerBatch; iteration++) {
      request();
    }

    const baseline = sampleMemory("baseline");
    printMemory("baseline", baseline);

    for (let batch = 1; batch <= batches; batch++) {
      for (let iteration = 0; iteration < requestsPerBatch; iteration++) {
        request();
      }

      const sample = `batch-${batch}`;
      const memory = sampleMemory(sample);
      printMemory(sample, memory, baseline);
    }

    sleep(5);

    const final = sampleMemory("final");
    printMemory("final", final, baseline);

    console.log(
      [
        "Server memory growth:",
        `rss=${formatDelta(final.rss - baseline.rss)}`,
        `heapTotal=${formatDelta(final.heapTotal - baseline.heapTotal)}`,
        `heapUsed=${formatDelta(final.heapUsed - baseline.heapUsed)}`,
        `external=${formatDelta(final.external - baseline.external)}`,
        `arrayBuffers=${formatDelta(final.arrayBuffers - baseline.arrayBuffers)}`,
      ].join(" "),
    );
  };
}

function sampleMemory(sample: string) {
  const response = http.get(`${baseUrl}/stats/memory`, {
    responseType: "text",
    tags: { name: "memory-stats" },
  });

  const succeeded = check(response, {
    "memory stats responds with 200": (response) => response.status === 200,
  });

  if (!succeeded) {
    throw new Error(`Unable to sample server memory: ${response.status}`);
  }

  const memory = response.json() as MemoryUsage;
  const tags = { sample };

  rss.add(memory.rss, tags);
  heapTotal.add(memory.heapTotal, tags);
  heapUsed.add(memory.heapUsed, tags);
  external.add(memory.external, tags);
  arrayBuffers.add(memory.arrayBuffers, tags);

  return memory;
}

function printMemory(
  sample: string,
  memory: MemoryUsage,
  baseline?: MemoryUsage,
) {
  const initial = baseline ?? memory;
  const value = (current: number, initial: number) => {
    const absolute = (current / 1024 / 1024).toFixed(2).padStart(7);
    const delta = current - initial;
    const sign = delta >= 0 ? "+" : "-";
    const difference = `${sign}${(Math.abs(delta) / 1024 / 1024).toFixed(2)}`;

    return `${absolute} (${difference.padStart(8)})`;
  };

  console.log(
    [
      sample.padEnd(sampleLabelWidth),
      `rss=${value(memory.rss, initial.rss)}`,
      `heap=${value(memory.heapUsed, initial.heapUsed)}`,
      `external=${value(memory.external, initial.external)}`,
      `buffers=${value(memory.arrayBuffers, initial.arrayBuffers)}`,
      "MiB",
    ].join(" "),
  );
}

function formatDelta(bytes: number) {
  const sign = bytes >= 0 ? "+" : "-";
  const mebibytes = Math.abs(bytes) / 1024 / 1024;

  return `${sign}${mebibytes.toFixed(2)} MiB`;
}
