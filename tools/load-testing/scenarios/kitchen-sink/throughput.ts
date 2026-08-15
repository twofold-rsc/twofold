import { check } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";

const baseUrl = "http://localhost:3000";

export const options: Options = {
  scenarios: {
    homepage_025rps: {
      executor: "constant-arrival-rate",
      rate: 25,
      timeUnit: "1s",
      duration: "30s",
      startTime: "0s",
      preAllocatedVUs: 100,
      maxVUs: 1_000,
      gracefulStop: "5s",
    },
    homepage_050rps: {
      executor: "constant-arrival-rate",
      rate: 50,
      timeUnit: "1s",
      duration: "30s",
      startTime: "35s",
      preAllocatedVUs: 100,
      maxVUs: 1_000,
      gracefulStop: "5s",
    },
    homepage_100rps: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "30s",
      startTime: "70s",
      preAllocatedVUs: 100,
      maxVUs: 1_000,
      gracefulStop: "5s",
    },
    homepage_200rps: {
      executor: "constant-arrival-rate",
      rate: 200,
      timeUnit: "1s",
      duration: "30s",
      startTime: "105s",
      preAllocatedVUs: 100,
      maxVUs: 1_000,
      gracefulStop: "5s",
    },
    homepage_400rps: {
      executor: "constant-arrival-rate",
      rate: 400,
      timeUnit: "1s",
      duration: "30s",
      startTime: "140s",
      preAllocatedVUs: 100,
      maxVUs: 1_000,
      gracefulStop: "5s",
    },
    homepage_800rps: {
      executor: "constant-arrival-rate",
      rate: 800,
      timeUnit: "1s",
      duration: "30s",
      startTime: "175s",
      preAllocatedVUs: 100,
      maxVUs: 1_000,
      gracefulStop: "5s",
    },
  },
  discardResponseBodies: true,
  thresholds: {
    "http_req_duration{name:kitchen-sink-page,scenario:homepage_025rps}": [
      "p(95)<500",
    ],
    "http_req_duration{name:kitchen-sink-page,scenario:homepage_050rps}": [
      "p(95)<500",
    ],
    "http_req_duration{name:kitchen-sink-page,scenario:homepage_100rps}": [
      "p(95)<500",
    ],
    "http_req_duration{name:kitchen-sink-page,scenario:homepage_200rps}": [
      "p(95)<500",
    ],
    "http_req_duration{name:kitchen-sink-page,scenario:homepage_400rps}": [
      "p(95)<500",
    ],
    "http_req_duration{name:kitchen-sink-page,scenario:homepage_800rps}": [
      "p(95)<500",
    ],
    "http_req_failed{name:kitchen-sink-page,scenario:homepage_025rps}": [
      "rate<0.01",
    ],
    "http_req_failed{name:kitchen-sink-page,scenario:homepage_050rps}": [
      "rate<0.01",
    ],
    "http_req_failed{name:kitchen-sink-page,scenario:homepage_100rps}": [
      "rate<0.01",
    ],
    "http_req_failed{name:kitchen-sink-page,scenario:homepage_200rps}": [
      "rate<0.01",
    ],
    "http_req_failed{name:kitchen-sink-page,scenario:homepage_400rps}": [
      "rate<0.01",
    ],
    "http_req_failed{name:kitchen-sink-page,scenario:homepage_800rps}": [
      "rate<0.01",
    ],
    checks: ["rate==1"],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/`, {
    tags: { name: "kitchen-sink-page" },
  });

  check(response, {
    "page responds with 200": (response) => response.status === 200,
  });
}
