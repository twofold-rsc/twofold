import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import { RscPayload } from "../payload.js";
import { rscStream } from "rsc-html-stream/client";

let initialPayload: Promise<RscPayload> | undefined = undefined;
export async function getInitialPayload() {
  if (initialPayload === undefined) {
    initialPayload = (async () =>
      await createFromReadableStream<RscPayload>(
        // initial RSC stream is injected in SSR stream as <script>...FLIGHT_DATA...</script>
        rscStream,
      ))();
  }
  return await initialPayload!;
}
