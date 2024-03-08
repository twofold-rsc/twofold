export class MultipartStream {
  #buffer = new Uint8Array();
  #encoder = new TextEncoder();
  #state = "SEARCHING";

  #response: Response;
  #contentType: string;
  #headers: Record<string, string>;

  #boundary: string;
  #boundaryEnd: string;
  #encodedBoundary: Uint8Array;
  #encodedBoundaryEnd: Uint8Array;
  #boundaryLength: number;
  #encodedHeaderEnd: Uint8Array;

  constructor({
    response,
    contentType,
    headers,
  }: {
    response: Response;
    contentType: string;
    headers: Record<string, string>;
  }) {
    let ctHeader = response.headers.get("content-type") ?? "";
    let [type, boundarySection] = ctHeader.split(";");

    if (type !== "multipart/mixed") {
      throw new Error("Invalid content type, expected multipart/mixed");
    }

    let [_, boundary] = boundarySection.split("boundary=");

    if (!boundary) {
      throw new Error("Missing boundary");
    }

    this.#boundary = boundary;

    this.#response = response;
    this.#contentType = contentType;
    this.#headers = headers;
    this.#boundary = `--${boundary}\n`;
    this.#boundaryEnd = `\n--${boundary}`;
    this.#encodedBoundary = this.#encoder.encode(this.#boundary);
    this.#encodedBoundaryEnd = this.#encoder.encode(this.#boundaryEnd);
    this.#boundaryLength = this.#encodedBoundary.length;
    this.#encodedHeaderEnd = this.#encoder.encode("\r\n\r\n");
  }

  get stream() {
    this.#state = "SEARCHING";

    let reader = this.#response.clone().body?.getReader();
    if (!reader) {
      throw new Error("Could not read response body");
    }

    let multipartStream = this;

    return new ReadableStream({
      start(controller) {
        async function push() {
          if (!reader) {
            throw new Error("Could not find reader");
          }

          let { done, value } = await reader.read();

          if (done) {
            controller.close();
            return;
          }

          if (value) {
            let { chunk, complete } = multipartStream.extractChunk(value);

            if (chunk) {
              controller.enqueue(chunk);
            }

            if (complete) {
              controller.close();
              return;
            }
          }

          push();
        }
        push();
      },
    });
  }

  private extractChunk(value: Uint8Array) {
    this.#buffer = concat(this.#buffer, value);

    if (this.#state === "SEARCHING") {
      let boundaryPos = this.findInBuffer(this.#encodedBoundary);
      let headersEndPos = this.findInBuffer(this.#encodedHeaderEnd);

      while (
        boundaryPos !== -1 &&
        headersEndPos !== -1 &&
        this.#state === "SEARCHING"
      ) {
        let headers = new Headers();
        let encodedHeaders = this.#buffer.slice(
          boundaryPos + this.#boundaryLength,
          headersEndPos,
        );
        let headerText = new TextDecoder().decode(encodedHeaders);
        let lines = headerText.split("\n");

        lines.forEach((line) => {
          let [key, value] = line.split(": ");
          headers.set(key, value);
        });

        let allHeadersMatch =
          headers.get("content-type") === this.#contentType &&
          Object.keys(this.#headers).every(
            (key) => headers.get(key) === this.#headers[key],
          );

        if (allHeadersMatch) {
          this.#state = "READING";
        }

        this.#buffer = this.#buffer.slice(
          headersEndPos + this.#encodedHeaderEnd.length,
        );

        boundaryPos = this.findInBuffer(this.#encodedBoundary);
        headersEndPos = this.findInBuffer(this.#encodedHeaderEnd);
      }
    }

    let send;
    if (this.#state === "READING") {
      let boundaryEndPos = this.findInBuffer(this.#encodedBoundaryEnd);

      if (boundaryEndPos !== -1) {
        this.#state = "COMPLETE";
        send = this.#buffer.slice(0, boundaryEndPos);
      } else {
        send = this.#buffer;
      }

      this.#buffer = new Uint8Array();
    }

    return {
      chunk: send,
      complete: this.#state === "COMPLETE",
    };
  }

  private findInBuffer(search: Uint8Array) {
    return findPos(search, this.#buffer);
  }
}

function findPos(search: Uint8Array, buffer: Uint8Array) {
  for (let i = 0; i <= buffer.length - search.length; i++) {
    let match = true;

    for (let j = 0; j < search.length; j++) {
      if (buffer[i + j] !== search[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      return i;
    }
  }

  return -1;
}

function concat(a1: Uint8Array, a2: Uint8Array) {
  const combined = new Uint8Array(a1.length + a2.length);

  combined.set(a1, 0);
  combined.set(a2, a1.length);

  return combined;
}
