"use client";

// build-error-on
// import { doesntexist } from "this-module-doesnt-exist";

export default function CCImportError() {
  // build-error-on
  // console.log({ doesntexist });
  return null;
}
