import { check, sleep } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";

export const options: Options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
  },
};

export default function () {
  const response = http.get("http://localhost:3000/");

  check(response, {
    "responds with 200": (response) => response.status === 200,
  });

  sleep(1);
}
