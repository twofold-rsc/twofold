import ActionThrowClientCatchCC from "./action-throw-client-catch-cc";

async function save() {
  "use server";
  throw new Error("Oh no!");
}

export default function ActionMissingUseServer() {
  return <ActionThrowClientCatchCC action={save} />;
}
