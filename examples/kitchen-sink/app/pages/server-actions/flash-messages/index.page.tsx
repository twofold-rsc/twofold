import { flash } from "@twofold/framework/flash";
import { redirect } from "@twofold/framework/redirect";
import { ClientForm } from "./client-form";
import { ObjectFlash } from "./object-flash";

function randomMessage() {
  let messages = [
    "Action completed successfully",
    "Your changes have been saved",
    "Item added to cart",
    "You have a new notification",
    "Form successfully saved",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

function toast() {
  "use server";

  flash(randomMessage());
}

function multipleToasts() {
  "use server";

  flash(randomMessage());
  flash(randomMessage());
  flash(randomMessage());
}

function redirectAndToast() {
  "use server";

  flash(randomMessage());
  redirect("/server-actions/flash-messages/end");
}

function objectFlashAction() {
  "use server";

  flash({ type: "object", text: "Hello" });
}

export default function FlashMessagesPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Flash & Toast messages
      </h1>
      <p className="mt-3 max-w-prose">
        This page tests a server action that triggers a flash message.
      </p>
      <div className="mt-4 space-y-4">
        <form action={toast}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/80"
          >
            Toast
          </button>
        </form>
        <form action={multipleToasts}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/80"
          >
            Multiple toasts
          </button>
        </form>
        <form action={redirectAndToast}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/80"
          >
            Redirect and toast
          </button>
        </form>
        <ClientForm />
        <ObjectFlash action={objectFlashAction} />
      </div>
    </div>
  );
}
