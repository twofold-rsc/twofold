export class LazyValue<T> {
  #load: (() => T) | undefined;
  #value!: T;
  #error: unknown;
  #hasError = false;

  constructor(load: () => T) {
    this.#load = load;
  }

  get value(): T {
    if (this.#hasError) {
      throw this.#error;
    }

    if (this.#load) {
      let load = this.#load;

      try {
        this.#value = load();
        this.#load = undefined;
      } catch (error) {
        this.#error = error;
        this.#hasError = true;
        this.#load = undefined;
        throw error;
      }
    }

    return this.#value;
  }
}
