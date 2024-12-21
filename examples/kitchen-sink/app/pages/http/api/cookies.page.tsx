import { APICookie } from "./api-cookie";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Cookies</h1>

      <p className="mt-4">Set and get cookies in API handlers.</p>

      <div className="mt-4">
        <APICookie />
      </div>
    </div>
  );
}
