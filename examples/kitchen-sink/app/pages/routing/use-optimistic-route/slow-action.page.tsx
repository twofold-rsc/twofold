import { data } from "./actions";
import { SlowActionForm } from "./slow-action-form";
import { RouteInfo } from "./route-info";

export default function SlowActionPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Slow action page</h1>
      <div className="mt-3">Count: {data.count}</div>
      <div className="mt-3">
        <SlowActionForm />
      </div>
      <div className="mt-3">
        <RouteInfo />
      </div>
    </div>
  );
}
