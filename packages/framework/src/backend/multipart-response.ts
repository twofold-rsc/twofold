import { randomUUID } from "crypto";

export class MultipartResponse {
  #boundary: string = randomUUID();

  #stringParts: { body: string; headers: Headers }[] = [];
  #streamParts: { body: ReadableStream; headers: Headers }[] = [];

  #encoder = new TextEncoder();

  constructor() {}

  add({
    type,
    body,
    headers,
  }: {
    type: string;
    body: ReadableStream | string;
    headers: Headers | Record<string, string>;
  }) {
    let headersObject = new Headers(headers);
    headersObject.set("Content-Type", type);

    if (typeof body === "string") {
      this.addStringPart({
        headers: headersObject,
        body,
      });
    } else if (body instanceof ReadableStream) {
      this.addStreamPart({
        headers: headersObject,
        body,
      });
    } else {
      throw new Error("Invalid body");
    }
  }

  private addStringPart({ body, headers }: { body: string; headers: Headers }) {
    headers.set("Content-Length", `${body.length}`);

    this.#stringParts.push({
      body,
      headers,
    });
  }

  private addStreamPart({
    body,
    headers,
  }: {
    body: ReadableStream;
    headers: Headers;
  }) {
    this.#streamParts.push({
      body,
      headers,
    });
  }

  private get stringBody() {
    return this.#stringParts
      .map(({ body, headers }) => {
        return `--${this.#boundary}\n${headersToText(headers)}\r\n\r\n${body}\n`;
      })
      .join("\n");
  }

  response() {
    let stringBody = this.stringBody;
    let streamParts = this.#streamParts;
    let boundary = this.#boundary;
    let encoder = this.#encoder;
    let closing = `--${this.#boundary}--`;

    let firstChunk = stringBody;

    let responseStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(firstChunk));

        for (let streamPart of streamParts) {
          let streamHeaders = `--${boundary}\n${headersToText(streamPart.headers)}\r\n\r\n`;
          controller.enqueue(encoder.encode(streamHeaders));

          let reader = streamPart.body.getReader();

          // pipe each stream in order
          let reading = true;
          while (reading) {
            let { done, value } = await reader.read();

            if (value) {
              controller.enqueue(value);
            }

            if (done) {
              controller.enqueue("\n");
              reading = false;
            }
          }

          reader.releaseLock();
        }

        controller.enqueue(encoder.encode(closing));
        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: this.headers,
    });
  }

  private get headers() {
    return new Headers({
      "Content-Type": `multipart/mixed; boundary=${this.#boundary}`,
    });
  }
}

function headersToText(headers: Headers) {
  return Array.from(headers.entries())
    .map(([key, value]) => {
      return `${key}: ${value}`;
    })
    .join("\n");
}
