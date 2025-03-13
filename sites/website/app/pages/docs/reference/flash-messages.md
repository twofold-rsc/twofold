# Flash messages

Flash messages provide immediate feedback in your UI when a user completes an action. They're perfect for toast notifications and alerts to keep users informed.

## Server actions

To create a flash message from a server action, use the `flash` function from `@twofold/framework/flash`.

```tsx
// app/pages/index.page.tsx

import { flash } from "@twofold/framework/flash";

function signIn() {
  "use server";

  // sign in the user...

  flash("You have successfully signed in!");

  redirect("/dashboard");
}

export function Page() {
  return (
    <form action={signIn}>
      {/* rest of sign in form */}
    </form>
  )
}
```

In this example, the `flash` function is called after the user successfully signs in. The message will be displayed to the user once they are redirected to the dashboard.

## Displaying messages

To display flash messages use the `useFlash` hook from `@twofold/framework/flash`. This hook is reactive, so it must be used in a client component or a component that is imported by a client component.

```tsx
"use client";

import { useFlash } from "@twofold/framework/flash";

export function ToastMessages() {
  const { messages } = useFlash();
  //       ^ an array of flash messages
  //         ex: ["You have successfully signed in!"]

  return (
    <div>
      {messages.map((message, index) => (
        <div key={index}>{message}</div>
      ))}
    </div>
  );
}
```

This component will display a list of all flash messages that have been set in the application.

By default, Twofold applications contain a built-in `<Toaster>` component located in `app/components/toaster.tsx`. This component uses the `useFlash` hook to display the latest flash message to the user.

See the [useFlash](/docs/reference/use-flash) documentation to learn more about this hook, like how to dismiss flash messages and style their appearance.

## Client actions

Just like server actions, client actions can create flash messages using the `flash()` function.

```tsx
"use client";

export function Form() {
  function saveAction() {
    // save the form data...

    flash("Form saved successfully!");
  }

  return (
    <form action={saveAction}>
      {/* rest of form */}
    </form>
  );
}
```

In this example, the `flash` function is called after the form data is saved. The message will be displayed to the user once the action completes.

## When to use flash messages

Flash messages are best used  to display a generic message to the user after an action is completed. Messages like "Form saved successfully", "Item deleted", or "You've been signed out due to inactivity" are good examples of flash messages.

They are not suitable for displaying errors or other critical information that requires immediate attention. For example, if a user enters an invalid email address, you should display an error message next to the input field instead of using a flash message.

## More information

* [useFlash](/docs/reference/use-flash)