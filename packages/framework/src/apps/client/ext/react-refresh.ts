// this file shouldn't end up in prod builds
/* eslint-disable */

// @ts-ignore
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
    function debounce(fn: () => void, timeout: number) {
      let u: NodeJS.Timeout;
      return () => {
        clearTimeout(u);
        u = setTimeout(fn, timeout);
      };
    }

    window.$RefreshRuntime$ = RefreshRuntime;
    let refresh = window.$RefreshRuntime$.performReactRefresh;

    window.$RefreshRuntime$.performReactRefresh = debounce(() => {
      refresh();
    }, 30);

    // @ts-ignore
    window.$RefreshRuntime$.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type: string) => type;
  } else {
    globalThis.$RefreshReg$ = () => {};
    globalThis.$RefreshSig$ = () => (type: string) => type;
  }
}
