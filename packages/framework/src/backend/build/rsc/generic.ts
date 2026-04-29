export class Generic {
  #loadModule: () => Promise<any>;

  constructor({ loadModule }: { loadModule: () => Promise<any> }) {
    this.#loadModule = loadModule;
  }

  async loadModule() {
    return await this.#loadModule();
  }

  async preload() {
    await this.loadModule();
  }
}
