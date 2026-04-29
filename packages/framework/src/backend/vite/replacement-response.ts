export type ReplacementResponse =
  | Response
  | { stream: ReadableStream<Uint8Array>; status?: number }
  | undefined;
