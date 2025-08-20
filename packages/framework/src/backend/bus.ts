import { EventEmitter } from "node:events";

export class Bus<E extends Record<string, any>> {
  private ee = new EventEmitter();

  constructor(maxListeners = 10) {
    if (maxListeners !== undefined) {
      this.ee.setMaxListeners(maxListeners);
    }
  }

  on<K extends keyof E>(type: K, fn: (payload: E[K]) => void) {
    this.ee.on(type as string, fn);
    return () => this.ee.off(type as string, fn); // unsubscribe
  }

  once<K extends keyof E>(type: K, fn: (payload: E[K]) => void) {
    this.ee.once(type as string, fn);
  }

  off<K extends keyof E>(type: K, fn: (payload: E[K]) => void) {
    this.ee.off(type as string, fn);
  }

  emit<K extends keyof E>(type: K, payload: E[K]) {
    this.ee.emit(type as string, payload);
  }

  disconnectAll() {
    this.ee.removeAllListeners();
  }
}
