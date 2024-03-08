import Control from "./control";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Action that returns a client component
      </h1>
      <div className="mt-3 space-y-3">
        <Control />
      </div>
    </div>
  );
}
