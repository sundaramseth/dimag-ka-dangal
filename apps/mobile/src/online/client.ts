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
    let url = process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    if (!url || !key) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      let r: Response;
      try {
        r = await fetch(
          "https://raw.githubusercontent.com/sundaramseth/dimag-ka-dangal/main/config/cloud.json",
          { signal: controller.signal, cache: "no-store" },
        );
      } finally {
        clearTimeout(timeout);
      }
      if (!r.ok) throw Error("Online setup is not available yet.");
      const config = await r.json();
      if (!config.ready) return null;
      url = config.url;
      key = config.publishableKey;
    }
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".supabase.co")
    )
      throw Error("Invalid cloud endpoint.");
    // Accept only public publishable keys. Secret/service keys never belong in a mobile client.
    if (!key.startsWith("sb_publishable_"))
      throw Error("A public publishable key is required.");
    const next = createClient(url, key, {
      auth: {
        storage: Platform.OS === "web" ? undefined : secureStorage,
        persistSession: Platform.OS !== "web",
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
