import { ParsedHeaderValue, parseHeaderValue } from "@hattip/headers";

export const headerAccept = "accept";
export const headerContentType = "content-type";
export const headerLocation = "location";

export const contentType = {
  rsc: "text/x-component;charset=utf-8",
  html: "text/html;charset=utf-8",
  plain: "text/plain;charset=utf-8",
  json: "application/json;charset=utf-8",
};

type ContentType = typeof contentType;
type ContentTypeKey = keyof ContentType;

export const contentTypePrimary = (() => {
  let result: {
    [P in keyof ContentType]?: string;
  } = {};
  for (const key in contentType) {
    result[key as ContentTypeKey] = parseHeaderValue(
      contentType[key as ContentTypeKey],
    )[0]!.value;
  }
  return result as ContentType;
})();

function isContentTypeGeneric(
  targetValue: string,
  headerValue: string | ParsedHeaderValue[] | null,
) {
  if (headerValue === null) {
    return false;
  }
  let parsedValue =
    typeof headerValue === "string"
      ? parseHeaderValue(headerValue)
      : headerValue;
  return parsedValue.some((x) => x.value === targetValue);
}

export const isContentType = (() => {
  let result: {
    [P in keyof ContentType]?: (
      headerValue: string | ParsedHeaderValue[] | null,
    ) => boolean;
  } = {};
  for (const key in contentType) {
    result[key as ContentTypeKey] = isContentTypeGeneric.bind(
      null,
      contentTypePrimary[key as ContentTypeKey],
    );
  }
  return result as {
    [P in keyof ContentType]: (
      headerValue: string | ParsedHeaderValue[] | null,
    ) => boolean;
  };
})();
