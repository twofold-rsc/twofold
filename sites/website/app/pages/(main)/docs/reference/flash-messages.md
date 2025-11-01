# Flash messages

Flash messages give immediate feedback after users complete an action. They are ideal for toast notifications and alerts, keeping users informed in a non-intrusive way.

In Twofold, flash messages work in both server and client actions, support complex data structures, and offer built-in type safety.

## Creating messages

To create flash messages from a server action, use the `flash` function from `@twofold/framework/flash`.

For example, to display a success message after the user signs in:

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

      <button type="submit">Sign in</button>
    </form>
  );
}
```

## Displaying messages

Use the `useFlash` hook to display flash messages in your UI. Since it's reactive, it must be used in a client component.

```tsx
"use client";

import { useFlash } from "@twofold/framework/flash";

export function ToastMessages() {
  let { messages } = useFlash();
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

By default, Twofold projects include a built-in `<Toaster>` component (located in `app/components/toaster.tsx`) that automatically listens for flash messages and displays them to users.

## Complex messages

Flash messages can store any JSON-serializable value, allowing you to include additional metadata like message types.

```tsx
// app/pages/index.page.tsx

import { flash } from "@twofold/framework/flash";

function signIn() {
  "use server";

  // sign in the user...

  flash({
    type: "success",
    content: "You have successfully signed in!",
  });

  redirect("/dashboard");
}

export function Page() {
  return (
    <form action={signIn}>
      {/* rest of sign in form */}

      <button type="submit">Sign in</button>
    </form>
  );
}
```

In a client component, `useFlash` has access to these structured messages. You can customize a message's styling or behavior based on its properties:

```tsx
"use client";

import { useFlash } from "@twofold/framework/flash";

export function ToastMessages() {
  let { messages } = useFlash();
  //       ^ [{
  //           type: "success",
  //           message: "You have successfully signed in!"
  //         }]

  return (
    <div>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`${
            message.type === "success" ? "text-green-500" : "text-red-500"
          }`}
        >
          {message.content}
        </div>
      ))}
    </div>
  );
}
```

## Typesafe messages

Enforcing types on flash messages ensures consistency between server actions and client components, reducing potential bugs.

The `useFlash` hook accepts a schema, allowing you to filter messages based on their structure.

For example, a server action can create multiple types of flash messages:

```tsx
// app/pages/index.page.tsx

import { flash } from "@twofold/framework/flash";

function signIn() {
  "use server";

  flash({
    type: "success",
    message: "You have successfully signed in!",
  });

  flash("You have three unread emails");
}
```

On the client, a schema ensures only specific messages are returned:

```tsx
"use client";

import { useFlash } from "@twofold/framework/flash";
import * as z from "zod";

export function SuccessMessages() {
  let { messages } = useFlash({
    schema: z.object({
      type: z.literal("success"),
    }),
  });

  console.log(messages);
  // ^ only the messages with a `type: success` property will be logged
  //   => [{
  //        type: "success",
  //        message: "You have successfully signed in!",
  //      }]
  //}
}

export function StringMessages() {
  let { messages } = useFlash({
    schema: z.string(),
  });

  console.log(messages);
  // ^ only the messages that are strings will be logged
  //   => ["You have three unread emails"]
}
```

## Dismissing messages

Flash messages can be dismissed manually by the user or automatically after a set period.

### Manual dismissal

To let users dismiss messages, use the `removeMessageById` function. The `messagesWithId` array provides messages along with their IDs:

```tsx
"use client";

import { useFlash } from "@twofold/framework/flash";

export function Messages() {
  let { messagesWithId, removeMessageById } = useFlash();

  return (
    <div>
      {messagesById.map(({ id, message }) => (
        <div key={id}>
          <span>{message}</span>

          <button onClick={() => removeMessageById(id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}
```

### Automatic Dismissal

For messages that should disappear after a delay, use the `clearAfter` option:

```tsx
"use client";

import { useFlash } from "@twofold/framework/flash";

export function Messages() {
  let { messages } = useFlash({
    clearAfter: 3000, // clears message after 3 seconds
  });

  return (
    <div>
      {messages.map(({ id, message }) => (
        <div key={id}>{message}</div>
      ))}
    </div>
  );
}
```

## Client actions

Flash messages aren't limited to server actions. They can also be created in client actions using the `flash()` function.

```tsx
"use client";

export function Form() {
  function saveAction() {
    // save the form data...

    flash("Form saved successfully!");
  }

  return <form action={saveAction}>{/* rest of form */}</form>;
}
```

## When to use flash messages

Flash messages are best for general notifications after an action is completed. Examples include:

- "Form saved successfully"
- "Item deleted"
- "You've been signed out due to inactivity"

They are not ideal for errors or critical information that requires immediate attention. For example, if a user enters an invalid email, it's better to display an error message next to the input field rather than using a flash message.
