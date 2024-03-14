export class RSC {
  path: string;
  css?: string;
  fileUrl: URL;

  constructor({
    path,
    css,
    fileUrl,
  }: {
    path: string;
    css?: string;
    fileUrl: URL;
  }) {
    this.path = path;
    this.fileUrl = fileUrl;
    this.css = css;
  }

  async runMiddleware(request: Request) {
    let module = await this.loadModule();
    if (module.before) {
      module.before(request);
    }
  }

  async loadModule() {
    let module = await import(this.fileUrl.href);
    return module;
  }
}
