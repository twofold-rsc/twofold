"use client";

export default function ClientAction({
  action,
}: {
  action: (newText: string) => Promise<string>;
}) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={async () => {
          let response = await action("ABC");
          console.log({ response });
        }}
        className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
      >
        Update to: ABC
      </button>

      <button
        onClick={async () => {
          let response = await action("hello world");
          console.log({ response });
        }}
        className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
      >
        Update to: hello world
      </button>
    </div>
  );
}
