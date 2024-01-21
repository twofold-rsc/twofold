// this file shouldn't end up in prod builds
/* eslint-disable */

// @ts-ignore
import RefreshRuntime from "react-refresh/runtime";

declare global {
  interface Window {
    $RefreshReg$: any;
    $RefreshSig$: any;
  }
}

if (process.env.NODE_ENV !== "production") {
  function debounce(fn: () => void, timeout: number) {
    let u: NodeJS.Timeout;
    return () => {
      clearTimeout(u);
      u = setTimeout(fn, timeout);
    };
  }

  window.$RefreshRuntime$ = RefreshRuntime;

  window.$RefreshRuntime$.performReactRefresh = debounce(
    window.$RefreshRuntime$.performReactRefresh,
    30,
  );

  // @ts-ignore
  window.$RefreshRuntime$.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type: string) => type;
}
