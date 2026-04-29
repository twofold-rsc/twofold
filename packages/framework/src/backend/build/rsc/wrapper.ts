export class Wrapper {
  #path: string;
  #loadModule: () => Promise<any>;

  constructor({
    path,
    loadModule,
  }: {
    path: string;
    loadModule: () => Promise<any>;
  }) {
    this.#path = path;
    this.#loadModule = loadModule;
  }

  get path() {
    return this.#path;
  }

  async loadModule() {
    return this.#loadModule();
  }

  async preload() {
    await this.loadModule();
  }
}
