import { randomBytes } from "crypto";

export function time(name: string) {
  let key = randomBytes(16).toString("hex");
  return {
    start() {
      performance.mark(`${key} start`);
    },
    end() {
      performance.mark(`${key} end`);
    },
    get duration() {
      let measure = performance.measure(
        `${key} duration`,
        `${key} start`,
        `${key} end`,
      );
      return measure.duration;
    },
    log() {
      console.log(`${name} duration ${this.duration.toFixed(2)}ms`);
    },
  };
}
