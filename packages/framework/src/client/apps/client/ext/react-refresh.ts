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
    let refresh = RefreshRuntime.performReactRefresh.bind(RefreshRuntime);
    window.$RefreshRuntime$ = RefreshRuntime;

    window.$RefreshRuntime$.performReactRefresh = createDebouncedFunction(
      () => refresh(),
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
  let pendingPromises: Array<{
    resolve: () => void;
    reject: (reason?: unknown) => void;
  }> = [];

  const debouncedFunction = () => {
    return new Promise<void>((resolve, reject) => {
      pendingPromises.push({ resolve, reject });

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        let promises = pendingPromises;
        pendingPromises = [];
        timer = null;

        try {
          fn();
          promises.forEach(({ resolve }) => resolve());
        } catch (error) {
          promises.forEach(({ reject }) => reject(error));
        }
      }, timeout);
    });
  };

  return debouncedFunction;
}
