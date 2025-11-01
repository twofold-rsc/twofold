// this file shouldn't end up in prod builds

// @ts-expect-error no types
import RefreshRuntime from "react-refresh/runtime";

declare global {
  interface Window {
    $RefreshReg$: any;
    $RefreshSig$: any;
  }

  var $RefreshReg$: any;
  var $RefreshSig$: any;
}

if (process.env.NODE_ENV !== "production") {
  if (typeof window !== "undefined") {
    window.$RefreshRuntime$ = RefreshRuntime;
    let refresh = window.$RefreshRuntime$.performReactRefresh;

    window.$RefreshRuntime$.performReactRefresh = createDebouncedFunction(
      () => {
        refresh();
      },
      30,
    );

    // @ts-expect-error setup by refresh
    window.$RefreshRuntime$.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type: string) => type;
  } else {
    globalThis.$RefreshReg$ = () => {};
    globalThis.$RefreshSig$ = () => (type: string) => type;
  }
}

function createDebouncedFunction(fn: () => void, timeout: number) {
  let timer: NodeJS.Timeout | null = null;
  let currentPromiseReject: ((reason?: any) => void) | null = null;

  const debouncedFunction = () => {
    if (timer) {
      clearTimeout(timer);
      if (currentPromiseReject) {
        currentPromiseReject(new Error("Debounced function reset"));
      }
    }

    return new Promise<void>((resolve, reject) => {
      currentPromiseReject = reject;
      timer = setTimeout(() => {
        try {
          fn();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          timer = null;
          currentPromiseReject = null;
        }
      }, timeout);
    });
  };

  return debouncedFunction;
}
