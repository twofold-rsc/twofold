import RouterInfo from "./router-info";

export default function RouterPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Router</h1>
      <div className="mt-3">
        <span className="text-sm text-gray-500">
          Current time: {new Date().toISOString()}
        </span>
      </div>
      <div className="mt-3">
        <RouterInfo />
      </div>
    </div>
  );
}
