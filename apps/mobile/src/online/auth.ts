import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";
import { getCloud } from "./client";
import config from "./public-config.json";
if (Platform.OS === "web" && typeof window !== "undefined")
  WebBrowser.maybeCompleteAuthSession();
let lastCode = "",
  exchange: Promise<void> | null = null;
export async function completeAuthCallback(url: string) {
  const u = new URL(url);
  const failure = u.searchParams.get("error_description");
  if (failure) throw Error(failure);
  const code = u.searchParams.get("code");
  if (!code) throw Error("No login code received. Try Google again.");
  if (code === lastCode) return exchange;
  lastCode = code;
  exchange = (async () => {
    const cloud = await getCloud();
    if (!cloud) throw Error("Cloud unavailable");
    const r = await cloud.auth.exchangeCodeForSession(code);
    if (r.error) {
      lastCode = "";
      throw r.error;
    }
  })();
  return exchange;
}
export async function googleSignIn() {
  const c = await getCloud();
  if (!c) throw Error("Cloud unavailable");
  const r = await fetch(config.url + "/auth/v1/settings", {
    headers: { apikey: config.publishableKey },
  });
  if (!r.ok) throw Error("Could not check Google login. Retry.");
  const settings = await r.json();
  if (!settings.external?.google)
    throw Error(
      "Google login needs the app owner’s Google OAuth setup. Solo and family play work without login.",
    );
  const redirect = makeRedirectUri({ scheme: "dangal", path: "auth/callback" });
  const { data, error } = await c.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirect, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw Error("Login URL unavailable");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirect);
  if (result.type === "success") await completeAuthCallback(result.url);
}
export function authMessage(e: unknown) {
  const m =
    e instanceof Error
      ? e.message
      : String((e as { message?: string })?.message || "Could not connect");
  if (/not authorized|sending confirmation|email rate/i.test(m))
    return "Email verification delivery is not configured for public testers yet. Use Google once enabled, or continue offline.";
  if (/invalid login/i.test(m))
    return "Email/password is incorrect, or confirm your email first.";
  return m;
}
