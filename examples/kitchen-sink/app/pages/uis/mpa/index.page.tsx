import z from "zod";
import { JavaScriptEnabled } from "./javascript-endabled";
import { Form } from "./form";

export type State = {
  username: string;
  success: boolean;
  error: string | null;
};

export const formSchema = z.object({
  username: z.string(),
});

async function signup(prev: State, formData: FormData): Promise<State> {
  "use server";

  let { username } = formSchema.parse(Object.fromEntries(formData.entries()));

  const isValid = username === "ryanto";

  return {
    username,
    success: isValid,
    error: isValid ? null : "Username is already taken",
  };
}

export default function MPAPage() {
  return (
    <div>
      <h1 className="text-5xl font-extrabold tracking-tight">
        Progressive RSC
      </h1>
      <div className="mt-6">
        <p className="max-w-prose">
          This page renders an form in React that is usable even if JavaScript
          is turned off.
        </p>
        <div className="mt-4">
          <JavaScriptEnabled />
        </div>
        <div className="mt-12">
          <Form signup={signup} />
        </div>
      </div>
    </div>
  );
}
