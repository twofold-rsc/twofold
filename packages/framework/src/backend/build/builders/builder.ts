export abstract class Builder {
  abstract name: string;
  abstract setup(): Promise<void>;
  abstract build(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract serialize(): Record<string, any>;
  abstract load(data: any): void;
  abstract warm(): Promise<void> | void;

  #error: Error | null = null;

  reportError(e: unknown) {
    let error = e instanceof Error ? e : new Error("Unknown error");
    this.#error = error;
  }

  clearError() {
    this.#error = null;
  }

  get error() {
    return this.#error;
  }
}
