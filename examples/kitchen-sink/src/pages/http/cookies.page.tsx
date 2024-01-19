import cookies from "@twofold/framework/cookies";

async function setCookie(formData: FormData) {
  "use server";

  let cookie = formData.get("cookie");

  cookies.set("my-cookie", typeof cookie === "string" ? cookie : "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}

async function destroyCookie() {
  "use server";

  cookies.destroy("my-cookie");
}

export default function Page() {
  let cookie = cookies.get("my-cookie");

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Cookies</h1>
      <div className="mt-6 flex items-center justify-center rounded border-4 border-dashed border-gray-200">
        <div className="py-12">
          <h2>
            Cookie{" "}
            <span className="rounded bg-gray-100 px-1.5 py-1 font-bold">
              `my-cookie`
            </span>{" "}
            value
          </h2>
          <div className="mt-6 flex min-h-[42px] items-center justify-center">
            {cookie ? (
              <p className="text-4xl font-medium">{cookie}</p>
            ) : (
              <p className="text-sm italic text-gray-500">Cookie not set</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-500">Update cookie</div>
        <div className="mt-2 flex items-center">
          <form action={setCookie} className="flex items-center space-x-4">
            <input
              type="text"
              name="cookie"
              placeholder="Cookie value"
              defaultValue={cookie}
              className="rounded border border-gray-300 px-2 py-1 shadow"
            />
            <button
              type="submit"
              className="rounded border border-transparent bg-gray-900 px-3.5 py-1 font-medium text-white shadow"
            >
              Set cookie
            </button>
          </form>

          <form action={destroyCookie} className="ml-auto">
            <button
              type="submit"
              className="rounded border border-gray-300 px-3.5 py-1 font-medium shadow hover:bg-gray-50"
            >
              Destroy cookie
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
