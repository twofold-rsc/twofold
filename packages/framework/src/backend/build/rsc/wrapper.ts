import { RSC } from "./rsc.js";

export class Wrapper {
  #rsc: RSC;

  constructor({ rsc }: { rsc: RSC }) {
    this.#rsc = rsc;
  }

  get rsc() {
    return this.#rsc;
  }
}
