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

  async runMiddleware(props: {
    params: Record<string, string | undefined>;
    searchParams: URLSearchParams;
    request: Request;
  }) {
    let module = await this.loadModule();
    if (module.before) {
      await module.before(props);
    }
  }

  async loadModule() {
    let module = await import(this.fileUrl.href);
    return module;
  }
}
