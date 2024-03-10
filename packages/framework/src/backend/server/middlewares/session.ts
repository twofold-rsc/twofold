import { SignedCookieStore, session as hattipSession } from "@hattip/session";
let secret = "secret";

export async function session() {
  let store = new SignedCookieStore(
    await SignedCookieStore.generateKeysFromSecrets([secret]),
  );

  return hattipSession({
    cookieName: "_twofold-session",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    },
    store,
    defaultSessionData: {},
  });
}
