import Control from "./control";

export default function StreamingActionPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Streaming action</h1>
      <p className="mt-3 max-w-prose">
        This page tests an action that returns a stream.
      </p>
      <div className="mt-3 space-y-3">
        <Control />
      </div>
    </div>
  );
}
