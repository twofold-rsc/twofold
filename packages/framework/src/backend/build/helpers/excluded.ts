// these files contain "use server", but not as directives. we can
// ignore them so we don't spend time parsing them.
let ignoreUseServers: RegExp[] = [
  /node_modules\/react-server-dom-webpack\/.*\/react-server-dom-webpack-client\.edge\..*\.js/,
  /node_modules\/react-server-dom-webpack\/.*\/react-server-dom-webpack-client\.browser\..*\.js/,
];

export function shouldIgnoreUseServer(path: string) {
  let hasIgnore = ignoreUseServers.some((ignore) => ignore.test(path));
  return hasIgnore;
}

// these files contain "use client", but not as directives. we can
// ignore them so we don't spend time parsing them.
let ignoreUseClients: RegExp[] = [
  /node_modules\/react-server-dom-webpack\/.*\/react-server-dom-webpack-client\..*\..*\.js/,
  /node_modules\/react-dom\/.*\/react-dom-client\..*\.js/,
  /node_modules\/react-server-dom-webpack\/.*\/react-server-dom-webpack-client\..*\..*\.js/,
  /node_modules\/react-server-dom-webpack\/.*\/react-server-dom-webpack-client\..*\..*\.js/,
];

export function shouldIgnoreUseClient(path: string) {
  let hasIgnore = ignoreUseClients.some((ignore) => ignore.test(path));
  return hasIgnore;
}
