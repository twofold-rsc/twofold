let shouldError = false;

async function action() {
  "use server";
  shouldError = true;
}

export default function Page() {
  if (shouldError) {
    // eslint-disable-next-line
    shouldError = false;
    throw new Error("Render error");
  }

  return (
    <div>
      <form action={action}>
        <button className="rounded bg-black px-3 py-1.5 text-sm text-white">
          Fire action
        </button>
      </form>
    </div>
  );
}
