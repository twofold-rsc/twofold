export function enableBuildErrors(source: string) {
  return source
    .replace(/(\/\/ build-error-on\n)(\s*)\/\/ ?([^\n]*)/g, "$1$2$3")
    .replace(/(\/\/ build-error-off\n)(\s*)(?!\/\/)([^\n]*)/g, "$1$2// $3")
    .replace(
      /(\{\/\* build-error-on \*\/\}\n)(\s*)\{\/\* ?([^\n]*) \*\/\}/g,
      "$1$2$3",
    );
}

export function disableBuildErrors(source: string) {
  return source
    .replace(/(\/\/ build-error-on\n)(\s*)(?!\/\/)([^\n]*)/g, "$1$2// $3")
    .replace(/(\/\/ build-error-off\n)(\s*)\/\/ ?([^\n]*)/g, "$1$2$3")
    .replace(
      /(\{\/\* build-error-on \*\/\}\n)(\s*)(?!\{\/\*)([^\n]*)/g,
      "$1$2{/* $3 */}",
    );
}
