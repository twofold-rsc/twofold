export class SegmentStub {
  #fileUrl: URL;

  constructor({ fileUrl }: { fileUrl: URL }) {
    this.#fileUrl = fileUrl;
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }
}
