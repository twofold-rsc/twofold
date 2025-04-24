export function applyPathParams(
  templatePath: string,
  params: Record<string, string | undefined>,
) {
  return templatePath.replace(/\$([^/]+)/g, (match, varName) => {
    return params[varName] ? params[varName] : match;
  });
}

export function pathIsValid(templatePath: string) {
  if (!templatePath.startsWith("/")) {
    return false;
  }

  if (templatePath === "/") {
    return true;
  }

  let segments = templatePath.split("/").slice(1);
  let matchers = new Set<string>();

  let isValid = segments.every((segment, index) => {
    let isWildcard = segment.startsWith("$$");
    let isMatcher = segment.startsWith("$") && !isWildcard;

    if (!segment) {
      return false;
    }

    if (isWildcard && index !== segments.length - 1) {
      return false;
    }

    if (isMatcher) {
      let alreadyExists = matchers.has(segment);
      matchers.add(segment);
      return !alreadyExists;
    }

    return true;
  });

  return isValid;
}

export function pathPartialMatches(templatePath: string, realPath: string) {
  return comparePaths(templatePath, realPath, "partial");
}

export function pathMatches(templatePath: string, realPath: string) {
  return comparePaths(templatePath, realPath, "full");
}

function comparePaths(
  templatePath: string,
  realPath: string,
  match: "partial" | "full",
) {
  if (!pathIsValid(templatePath)) {
    return false;
  }

  if (templatePath === realPath) {
    return true;
  }

  // normalize template path by removing pathless segments
  let templateWithoutPathless = templatePath
    .split("/")
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .filter((segment) => segment !== "")
    .join("/");

  let templateSegments = templateWithoutPathless
    .split("/")
    .filter((segment) => segment !== "");

  let realSegments = realPath.split("/").filter((segment) => segment !== "");

  let hasWildcard =
    templateSegments[templateSegments.length - 1]?.startsWith("$$");

  let segments = zip(templateSegments, realSegments);

  let hasMatch = segments.every(([templateSegment, realSegment], index) => {
    if (match === "full" && templateSegment === undefined && !hasWildcard) {
      return false;
    }

    if (match === "partial" && templateSegment === undefined) {
      return true;
    }

    if (realSegment === undefined) {
      return false;
    }

    if (templateSegment === realSegment) {
      return true;
    }

    if (templateSegment?.startsWith("$") && realSegment) {
      return true;
    }

    if (hasWildcard && index >= templateSegments.length - 1) {
      return true;
    }
  });

  return hasMatch;
}

function zip<T, U>(array1: T[], array2: U[]): [T | undefined, U | undefined][] {
  let maxLength = Math.max(array1.length, array2.length);
  let result: [T | undefined, U | undefined][] = [];

  for (let i = 0; i < maxLength; i++) {
    result.push([array1[i], array2[i]]);
  }

  return result;
}
