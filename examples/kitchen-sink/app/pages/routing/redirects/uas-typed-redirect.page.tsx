import { UASTypedRedirectForm } from "./uas-typed-redirect-form";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Typed useActionState redirect
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          An action invoked inside of useActionState that returns an object with
          a specific type shape or triggers a redirect. If a redirect is
          triggered then the uAS function should not return undefined.
        </p>

        <div className="mt-6">
          <UASTypedRedirectForm />
        </div>
      </div>
    </div>
  );
}
