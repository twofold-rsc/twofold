import { check } from "k6";
import http from "k6/http";
import { baseUrl, createMemoryTest, options } from "./shared.ts";

export { options };

export default createMemoryTest(() => {
  const response = http.head(`${baseUrl}/`, {
    tags: { name: "kitchen-sink-page-head" },
  });

  check(response, {
    "homepage HEAD responds with 200": (response) => response.status === 200,
  });
});
