type Matcher = {
  isWildcard: boolean;
  name: string;
  raw: string;
  suffix: string;
};

type Segment = {
  matcher: Matcher | undefined;
  raw: string;
};

export class RoutePath {
  #catchAllSegments: readonly string[];
  #dynamicSegments: readonly string[];
  #fixedSegments: Segment[];
  #isValid: boolean;
  #matchers: Matcher[];
  #pattern?: URLPattern;
  #patternPathname: string;
  #segments: Segment[];
  #template: string;
  #templateSegments: Segment[];
  #wildcardSegment: Segment | undefined;

  constructor(template: string) {
    this.#template = template;

    this.#templateSegments = template
      .split("/")
      .map((raw) => ({ raw, matcher: parseMatcher(raw) }));
    let routeSegments = this.#templateSegments.slice(1);
    this.#isValid = routeIsValid(template, routeSegments);
    this.#segments = routeSegments.filter(
      (segment) => segment.raw && !isPathless(segment.raw),
    );
    this.#matchers = this.#segments.flatMap((segment) =>
      segment.matcher ? [segment.matcher] : [],
    );
    this.#dynamicSegments = this.#matchers
      .filter((matcher) => !matcher.isWildcard)
      .map((matcher) => matcher.raw);
    this.#catchAllSegments = this.#matchers
      .filter((matcher) => matcher.isWildcard)
      .map((matcher) => matcher.raw);
    let lastSegment = this.#segments.at(-1);
    this.#wildcardSegment = lastSegment?.matcher?.isWildcard
      ? lastSegment
      : undefined;
    this.#fixedSegments = this.#wildcardSegment
      ? this.#segments.slice(0, -1)
      : this.#segments;
    this.#patternPathname = patternPathname(this.#segments);
  }

  get template() {
    return this.#template;
  }

  get isValid() {
    return this.#isValid;
  }

  get isDynamic() {
    return this.#matchers.length > 0;
  }

  get isCatchAll() {
    return this.#wildcardSegment !== undefined;
  }

  get dynamicSegments() {
    return this.#dynamicSegments;
  }

  get catchAllSegments() {
    return this.#catchAllSegments;
  }

  matches(pathname: string) {
    return this.#compare(pathname, "full");
  }

  partiallyMatches(pathname: string) {
    return this.#compare(pathname, "partial");
  }

  apply(params: Record<string, string | undefined>) {
    return this.#templateSegments
      .map((segment) => {
        if (!segment.matcher) {
          return segment.raw;
        }

        let value = params[segment.matcher.name];
        return value === undefined
          ? segment.raw
          : `${value}${segment.matcher.suffix}`;
      })
      .join("/");
  }

  params(url: URL) {
    if (this.#matchers.length === 0) {
      return {};
    }

    this.#pattern ??= new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: this.#patternPathname,
    });

    let groups = this.#pattern.exec(url)?.pathname.groups ?? {};
    let params = this.#matchers.flatMap((matcher, index) => {
      let value = groups[`tf${index}`];
      return value === undefined ? [] : [[matcher.name, value] as const];
    });

    return Object.fromEntries(params);
  }

  #compare(pathname: string, match: "partial" | "full") {
    if (!this.#isValid) {
      return false;
    }

    if (this.#template === pathname) {
      return true;
    }

    let realSegments = pathname.split("/").filter((segment) => segment !== "");
    let fixedSegmentsMatch = this.#fixedSegments.every((segment, index) => {
      let realSegment = realSegments[index];
      return realSegment !== undefined && segmentMatches(segment, realSegment);
    });

    if (!fixedSegmentsMatch) {
      return false;
    }

    if (this.#wildcardSegment) {
      let remainingPath = realSegments
        .slice(this.#fixedSegments.length)
        .join("/");
      return segmentMatches(this.#wildcardSegment, remainingPath);
    }

    return match === "partial"
      ? realSegments.length >= this.#segments.length
      : realSegments.length === this.#segments.length;
  }
}

function routeIsValid(template: string, segments: Segment[]) {
  if (!template.startsWith("/")) {
    return false;
  }

  if (template === "/") {
    return true;
  }

  let matchers = new Set<string>();

  return segments.every((segment, index) => {
    if (!segment.raw || (segment.raw.startsWith("$") && !segment.matcher)) {
      return false;
    }

    if (segment.matcher?.isWildcard && index !== segments.length - 1) {
      return false;
    }

    if (segment.matcher) {
      let alreadyExists = matchers.has(segment.matcher.name);
      matchers.add(segment.matcher.name);
      return !alreadyExists;
    }

    return true;
  });
}

function patternPathname(segments: Segment[]) {
  let matcherIndex = 0;
  let patternSegments = segments.map((segment) => {
    if (!segment.matcher) {
      return segment.raw;
    }

    let pattern = segment.matcher.isWildcard ? "(.*)" : "";
    return `:tf${matcherIndex++}${pattern}${segment.matcher.suffix}`;
  });

  return `/${patternSegments.join("/")}`;
}

function segmentMatches(segment: Segment, realSegment: string) {
  if (segment.raw === realSegment) {
    return true;
  }

  if (!segment.matcher) {
    return false;
  }

  return (
    realSegment.length > segment.matcher.suffix.length &&
    realSegment.endsWith(segment.matcher.suffix)
  );
}

function parseMatcher(segment: string) {
  let isWildcard = segment.startsWith("$$");
  let prefixLength = isWildcard ? 2 : segment.startsWith("$") ? 1 : 0;

  if (prefixLength === 0) {
    return;
  }

  let name: string | undefined;
  let suffix: string;

  if (segment[prefixLength] === "[") {
    let closingBracket = segment.indexOf("]", prefixLength + 1);
    name = segment.slice(prefixLength + 1, closingBracket);

    if (closingBracket === -1 || !/^[\w-]+$/.test(name)) {
      return;
    }

    suffix = segment.slice(closingBracket + 1);
  } else {
    name = segment.slice(prefixLength).match(/^\w+/)?.[0];
    if (!name) {
      return;
    }

    suffix = segment.slice(prefixLength + name.length);
  }

  return {
    isWildcard,
    name,
    raw: segment,
    suffix,
  };
}

function isPathless(segment: string) {
  return /^\(.*\)$/.test(segment);
}
