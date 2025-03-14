# useFlash

The `useFlash` hook gives client components access to flash messages created from actions.

## Usage

To use the `useFlash` hook:

```tsx
"use client";

import { flash } from "@twofold/framework/flash";

export default function ClientComponent() {
  let { messages } = useFlash();

  return (
    <div>
      {messages.map((message, index) => (
        <div key={index}>{message}</div>
      ))}
    </div>
  );
}
```

To learn more about flash messages in Twofold, see the [Flash messages](/docs/reference/flash-messages) documentation.

## Options

The following options can be passed to `useFlash`:

```tsx
useFlash({
  schema: ZodSchema,
  clearAfter: number;
});
```

| Property     | Type        | Description                                                                                                                                              |
| ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`     | `ZodSchema` | A [zod](https://zod.dev/) schema used to filter and type messages.                                                                                       |
| `clearAfter` | `number`    | The amount of time, in milliseconds, to wait before automatically removing a flash message. If not provided, messages will not be removed automatically. |

## Return values

The values returned by `useFlash`:

```tsx
"use client";

import { useFlash } from "@twofold/framework/use-flash";

function ClientComponent() {
  let { messages, messagesWithId, removeMessageById } = useFlash();

  // ...
}
```

The `useFlash` hook returns an object with the following properties:

| Property            | Type                                 | Description                                                                  |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `messages`          | `unknown[]`                          | A list of all flash messages.                                                |
| `messagesWithId`    | `{ message: unknown, id: string }[]` | A list of messages and their IDs.                                            |
| `removeMessageById` | `(id: string) => void`               | A function that removes flash messages. Pass in an ID from `messagesWithId`. |
