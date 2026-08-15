import { check } from "k6";
import http from "k6/http";
import { baseUrl, createMemoryTest, options } from "./shared.ts";

export { options };

export default createMemoryTest(() => {
  const response = http.get(`${baseUrl}/`, {
    tags: { name: "kitchen-sink-page" },
  });

  check(response, {
    "page responds with 200": (response) => response.status === 200,
  });
});
