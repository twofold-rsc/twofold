import { allowIfCookieSet } from "@/app/auth";
import { AuthPolicyArray } from "@twofold/framework/auth";

export const auth: AuthPolicyArray = [allowIfCookieSet];
