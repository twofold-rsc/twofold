import { randomUUID } from "crypto";

export class MultipartResponse {
  #boundary: string = randomUUID();

  #stringParts: { body: string; headers: Headers }[] = [];
  #streamPart?: { body: ReadableStream; headers: Headers };

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
    this.#streamPart = {
      body,
      headers,
    };
  }

  response() {
    if (this.#streamPart) {
      return this.streamResponse();
    } else {
      return this.stringResponse();
    }
  }

  private get stringBody() {
    return this.#stringParts
      .map(({ body, headers }) => {
        return `--${this.#boundary}\n${headersToText(headers)}\r\n\r\n${body}`;
      })
      .join("\n");
  }

  private stringResponse() {
    let closing = `\n--${this.#boundary}--`;
    return new Response(`${this.stringBody}\n${closing}`, {
      headers: this.headers,
    });
  }

  private streamResponse() {
    if (!this.#streamPart) {
      throw new Error("Cannot stream response without stream");
    }

    let stringBody = this.stringBody;
    let streamHeaders = `--${this.#boundary}\n${headersToText(
      this.#streamPart.headers,
    )}\r\n\r\n`;

    let reader = this.#streamPart.body.getReader();
    let encoder = this.#encoder;
    let closing = `\n--${this.#boundary}--`;

    let firstChunk = [stringBody, streamHeaders].join("\n");

    let responseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(firstChunk));

        async function push() {
          let { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode(closing));
            controller.close();
            reader.releaseLock();
            return;
          }

          controller.enqueue(value);
          push();
        }

        push();
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
