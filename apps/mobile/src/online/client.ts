import { ensureSecureCrypto } from "./crypto";
import publicConfig from "./public-config.json";
import {
  createClient,
  processLock,
  SupabaseClient,
} from "@supabase/supabase-js";
import { Platform, AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};
let client: SupabaseClient | null = null,
  pending: Promise<SupabaseClient | null> | null = null;
export async function getCloud(): Promise<SupabaseClient | null> {
  if (client) return client;
  if (pending) return pending;
  pending = (async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL || publicConfig.url;
    const key =
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      publicConfig.publishableKey;
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".supabase.co")
    )
      throw Error("Invalid cloud endpoint.");
    // Accept only public publishable keys. Secret/service keys never belong in a mobile client.
    if (!key.startsWith("sb_publishable_"))
      throw Error("A public publishable key is required.");
    ensureSecureCrypto();
    const next = createClient(url, key, {
      auth: {
        storage:
          Platform.OS === "web"
            ? {
                getItem: (k: string) =>
                  typeof window !== "undefined"
                    ? window.sessionStorage.getItem(k)
                    : null,
                setItem: (k: string, v: string) => {
                  if (typeof window !== "undefined")
                    window.sessionStorage.setItem(k, v);
                },
                removeItem: (k: string) => {
                  if (typeof window !== "undefined")
                    window.sessionStorage.removeItem(k);
                },
              }
            : secureStorage,
        persistSession: true,
        flowType: "pkce",
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
    if (Platform.OS !== "web")
      AppState.addEventListener("change", (s) => {
        if (s === "active") next.auth.startAutoRefresh();
        else next.auth.stopAutoRefresh();
      });
    client = next;
    return next;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
