import * as t from "@babel/types";

export function hasUseClientDirective(program: t.Program | undefined) {
  if (!program || !program.directives) return false;
  return program.directives.some((directive) =>
    t.isDirectiveLiteral(directive.value, { value: "use client" }),
  );
}
