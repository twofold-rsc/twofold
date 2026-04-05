/**
 * When authentication policies inspect the request, such as by calling formData(), it causes server actions to fail to bind arguments to FormData because the formData has already been read.
 *
 * This implementation proxies a request and caches the first Promise<> result from those functions, so that code does not need to be aware of whether the body has already been read by an authentication policy.
 */
export class ProxyingRequest implements Request {
  #original: Request;
  #arrayBuffer: Promise<ArrayBuffer> | undefined;
  #blob: Promise<Blob> | undefined;
  #bytes: Promise<Uint8Array<ArrayBuffer>> | undefined;
  #formData: Promise<FormData> | undefined;
  #json: Promise<any> | undefined;
  #text: Promise<string> | undefined;

  constructor(original: Request) {
    this.#original = original;
  }

  get cache(): RequestCache {
    return this.#original.cache;
  }

  get credentials(): RequestCredentials {
    return this.#original.credentials;
  }

  get destination(): RequestDestination {
    return this.#original.destination;
  }

  get headers(): Headers {
    return this.#original.headers;
  }

  get integrity(): string {
    return this.#original.integrity;
  }

  get keepalive(): boolean {
    return this.#original.keepalive;
  }

  get method(): string {
    return this.#original.method;
  }

  get mode(): RequestMode {
    return this.#original.mode;
  }

  get redirect(): RequestRedirect {
    return this.#original.redirect;
  }

  get referrer(): string {
    return this.#original.referrer;
  }

  get referrerPolicy(): ReferrerPolicy {
    return this.#original.referrerPolicy;
  }

  get signal(): AbortSignal {
    return this.#original.signal;
  }

  get url(): string {
    return this.#original.url;
  }

  get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null {
    return this.#original.body;
  }

  get bodyUsed(): boolean {
    return this.#original.bodyUsed;
  }

  clone(): Request {
    return new ProxyingRequest(this.#original.clone());
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    if (this.#arrayBuffer) {
      return this.#arrayBuffer;
    }
    this.#arrayBuffer = this.#original.arrayBuffer();
    return this.#arrayBuffer;
  }

  blob(): Promise<Blob> {
    if (this.#blob) {
      return this.#blob;
    }
    this.#blob = this.#original.blob();
    return this.#blob;
  }

  bytes(): Promise<Uint8Array<ArrayBuffer>> {
    if (this.#bytes) {
      return this.#bytes;
    }
    this.#bytes = this.#original.bytes();
    return this.#bytes;
  }

  formData(): Promise<FormData> {
    if (this.#formData) {
      return this.#formData;
    }
    this.#formData = this.#original.formData();
    return this.#formData;
  }

  json(): Promise<any> {
    if (this.#json) {
      return this.#json;
    }
    this.#json = this.#original.json();
    return this.#json;
  }

  text(): Promise<string> {
    if (this.#text) {
      return this.#text;
    }
    this.#text = this.#original.text();
    return this.#text;
  }
}
