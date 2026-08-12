import { NavAndSlowActionForm } from "./nav-and-slow-action-form";
import { RouteInfo } from "./route-info";

export default function SlowActionPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">
        Navigate and slow action page
      </h1>
      <p className="mt-3">
        This page fires a transition that triggers both a navigation and a slow
        action.
      </p>
      <div className="mt-3">
        <NavAndSlowActionForm />
      </div>
      <div className="mt-3">
        <RouteInfo />
      </div>
    </div>
  );
}
