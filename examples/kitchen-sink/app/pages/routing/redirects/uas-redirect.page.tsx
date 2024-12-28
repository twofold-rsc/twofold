import { UASRedirectForm } from "./uas-redirect-form";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        useActionState redirect
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          An action invoked inside of useActionState that triggers a redirect.
          This action will run twice before redirecting.
        </p>

        <div className="mt-6">
          <UASRedirectForm />
        </div>
      </div>
    </div>
  );
}
