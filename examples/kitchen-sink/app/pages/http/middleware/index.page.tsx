import cookies from "@twofold/framework/cookies";

export async function before() {
  console.log("running before middleware");
  cookies.set("ran-middleware", "true");
}

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Middleware</h1>

      <p className="mt-4">
        This page uses middleware to log to the console before rendering.
      </p>
    </div>
  );
}
