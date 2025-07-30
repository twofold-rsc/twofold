"use client";

import { use } from "react";
import {
  Context,
  SegmentContext,
} from "../apps/client/contexts/segment-context";

export function SegmentStubReader() {
  let { segments } = use(Context);
  let [segment, ...rest] = segments;

  return (
    <>
      {!segment ? null : rest.length > 0 ? (
        <SegmentContext segments={rest}>{segment.tree}</SegmentContext>
      ) : (
        <>{segment.tree}</>
      )}
    </>
  );
}
