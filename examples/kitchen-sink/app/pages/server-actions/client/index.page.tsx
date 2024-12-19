import Client from "./client";

let text = "hello world";

async function handleTextArg(newText: string) {
  "use server";
  text = newText;
  return `updated server side text to ${newText}`;
}

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Client action</h1>
      <p className="mt-3 max-w-prose">
        In this example a server action is passed to a client component. The
        client component invokes the action passing in text data.
      </p>
      <p className="mt-3">
        The text on the server is{" "}
        <span className="bg-purple-50 px-1.5 py-0.5 font-medium text-purple-900">
          {text}
        </span>
      </p>
      <div className="mt-4">
        <Client action={handleTextArg} />
      </div>
    </div>
  );
}
