import * as t from "@babel/types";

export function envKey(name: string) {
  return t.memberExpression(
    t.memberExpression(t.identifier("process"), t.identifier("env")),
    t.stringLiteral(name),
    true,
  );
}

export function stringKey(name: string) {
  return t.stringLiteral(name);
}
