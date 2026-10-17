import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { AppState } from "react-native";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getCloud } from "./client";
import { authMessage } from "./auth";
import config from "./public-config.json";
export type Friend = {
  peer_id: string;
  handle: string;
  display_name: string;
  status: "pending" | "accepted";
  incoming: boolean;
  online: boolean;
};
export type OnlineMatch = {
  id: string;
  game: "zip" | "maze";
  puzzle: number;
  seed: number;
  user_a: string;
  user_b: string | null;
  state: "waiting" | "invited" | "active" | "finished" | "cancelled";
  starts_at: string | null;
  expires_at: string;
  server_now: string;
  winner: string | null;
  players: {
    id: string;
    name: string;
    handle: string;
    elapsed_ms: number | null;
  }[];
};
export type Ranking = {
  position: number;
  id: string;
  name: string;
  handle: string;
  wins: number;
  played: number;
  is_self: boolean;
};
export type CloudProfile = {
  id: string;
  handle: string;
  display_name: string;
  avatar: number;
  avatar_url: string;
  gender: string;
  country: string;
};
// PostgREST can serialize a composite RPC result as a one-row array.
function profileRow(value: CloudProfile | CloudProfile[]): CloudProfile {
  const p = Array.isArray(value) ? value[0] : value;
  if (!p || typeof p.id !== "string" || typeof p.display_name !== "string") throw Error("Profile unavailable. Please retry.");
  return p;
}
type SocialState = {
  cloud: SupabaseClient | null;
  session: Session | null;
  profile: CloudProfile | null;
  friends: Friend[];
  inbox: OnlineMatch[];
  match: OnlineMatch | null;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  saveProfile: (p: CloudProfile) => Promise<void>;
  rpc: <T = unknown>(
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<T>;
  queue: (game: "zip" | "maze", peer?: string) => Promise<void>;
  accept: (id: string) => Promise<void>;
  leave: () => Promise<void>;
  select: (m: OnlineMatch | null) => void;
  submit: (id: string, path: number[]) => Promise<void>;
};
const Context = createContext<SocialState | null>(null);
export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [cloud, setCloud] = useState<SupabaseClient | null>(null),
    [session, setSession] = useState<Session | null>(null),
    [profile, setProfile] = useState<CloudProfile | null>(null),
    [friends, setFriends] = useState<Friend[]>([]),
    [inbox, setInbox] = useState<OnlineMatch[]>([]),
    [match, setMatch] = useState<OnlineMatch | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const selected = useRef<OnlineMatch | null>(null);
  const identity = useRef("");
  identity.current = session?.user.id || "";
  const bootstrapped = useRef(""),
    profileRevision = useRef(0);
  const select = useCallback((m: OnlineMatch | null) => {
    selected.current = m;
    setMatch(m);
  }, []);
  useEffect(() => {
    let alive = true;
    getCloud()
      .then((c) => {
        if (alive) setCloud(c);
      })
      .catch((e) => {
        if (alive) setError(authMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!cloud) return;
    let alive = true;
    cloud.auth
      .getSession()
      .then((r) => {
        if (alive) setSession(r.data.session);
      })
      .catch((e) => setError(authMessage(e)));
    const { data } = cloud.auth.onAuthStateChange((_, s) => {
      if (alive) setSession(s);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [cloud]);
  const rpc = useCallback(
    async <T,>(name: string, args?: Record<string, unknown>): Promise<T> => {
      if (!cloud) throw Error("Cloud connection unavailable");
      const r = await cloud.rpc(name, args);
      if (r.error) throw r.error;
      return r.data as T;
    },
    [cloud],
  );
  const refresh = useCallback(async () => {
    if (!cloud || !session) {
      setProfile(null);
      setFriends([]);
      setInbox([]);
      select(null);
      return;
    }
    const userId = session.user.id,
      revision = profileRevision.current;
    if (bootstrapped.current !== userId) {
      const p = profileRow(await rpc<CloudProfile | CloudProfile[]>("dangal_profile_sync"));
      if (identity.current !== userId) return;
      setProfile(p);
      bootstrapped.current = userId;
    }
    const [p, f, i] = await Promise.all([
      cloud
        .from("dangal_profiles")
        .select("id,handle,display_name,avatar,avatar_url,gender,country")
        .eq("id", session.user.id)
        .maybeSingle(),
      (async () => {
        let all: Friend[] = [],
          offset = 0;
        for (;;) {
          const page = await rpc<Friend[]>("dangal_friend_page", {
            p_offset: offset,
          });
          all = all.concat(page || []);
          if (page.length < 200) return all;
          offset += 200;
        }
      })(),
      rpc<OnlineMatch[]>("dangal_match_inbox"),
    ]);
    if (identity.current !== userId) return;
    if (p.error) throw p.error;
    if (revision === profileRevision.current) setProfile(p.data);
    setFriends(f || []);
    setInbox(i || []);
    const current = selected.current;
    if (current) {
      const m = await rpc<OnlineMatch>("dangal_match_state", {
        p_id: current.id,
      });
      select(m);
    } else {
      const active = (i || []).find((m) => m.state === "active");
      if (active) select(active);
    }
    setError("");
  }, [cloud, session, rpc, select]);
  useEffect(() => {
    if (!session || !cloud) return;
    let disposed = false,
      inflight = false,
      lastBeat = 0;
    const poll = async () => {
      if (disposed || inflight || AppState.currentState === "background")
        return;
      inflight = true;
      try {
        if (Date.now() - lastBeat > 14000) {
          await rpc("dangal_heartbeat", { p_online: true });
          lastBeat = Date.now();
        }
        await refresh();
      } catch (e) {
        if (!disposed) setError(authMessage(e));
      } finally {
        inflight = false;
      }
    };
    void poll();
    const timer = setInterval(poll, 3000);
    const app = AppState.addEventListener("change", (s) => {
      if (s === "active") void poll();
      else void rpc("dangal_heartbeat", { p_online: false }).catch(() => {});
    });
    return () => {
      disposed = true;
      clearInterval(timer);
      app.remove();
      void rpc("dangal_heartbeat", { p_online: false }).catch(() => {});
    };
  }, [session, cloud, rpc, refresh]);
  useEffect(() => {
    if (session) return;
    const t = setTimeout(() => {
      setProfile(null);
      setFriends([]);
      setInbox([]);
      select(null);
    }, 0);
    return () => clearTimeout(t);
  }, [session, select]);
  const saveProfile = async (p: CloudProfile) => {
    const saved = profileRow(await rpc<CloudProfile | CloudProfile[]>("dangal_edit_profile", {
      p_handle: p.handle,
      p_name: p.display_name,
      p_avatar: p.avatar,
      p_gender: p.gender,
      p_country: p.country,
    }));
    profileRevision.current++;
    setProfile(saved);
    await refresh();
  };
  useEffect(() => {
    if (!cloud || !session) return;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const signal = () => {
      clearTimeout(pending);
      pending = setTimeout(
        () => void refresh().catch((e) => setError(authMessage(e))),
        100,
      );
    };
    const channel = cloud
      .channel(`social:${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dangal_matches",
          filter: `user_a=eq.${session.user.id}`,
        },
        signal,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dangal_matches",
          filter: `user_b=eq.${session.user.id}`,
        },
        signal,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dangal_profiles",
          filter: `id=eq.${session.user.id}`,
        },
        signal,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dangal_friendships" },
        signal,
      )
      .subscribe();
    return () => {
      clearTimeout(pending);
      void cloud.removeChannel(channel);
    };
  }, [cloud, session, refresh]);
  const queue = async (game: "zip" | "maze", peer?: string) => {
    await rpc("dangal_heartbeat", { p_online: true });
    select(
      await rpc<OnlineMatch>("dangal_queue", {
        p_game: game,
        p_peer: peer || null,
      }),
    );
    await refresh();
  };
  const accept = async (id: string) => {
    select(await rpc<OnlineMatch>("dangal_accept_match", { p_id: id }));
    await refresh();
  };
  const leave = async () => {
    if (selected.current)
      await rpc("dangal_leave_match", { p_id: selected.current.id });
    select(null);
    await refresh();
  };
  const submit = async (id: string, path: number[]) => {
    if (!cloud) throw Error("Sign in required");
    const { data } = await cloud.auth.getSession();
    if (!data.session) throw Error("Sign in again");
    const r = await fetch(config.url + "/functions/v1/dangal-finish", {
      method: "POST",
      headers: {
        apikey: config.publishableKey,
        Authorization: "Bearer " + data.session.access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId: id, path }),
    });
    const body = await r.json();
    if (!r.ok) throw Error(body.error || "Result not accepted");
    await refresh();
  };
  return (
    <Context.Provider
      value={{
        cloud,
        session,
        profile,
        friends,
        inbox,
        match,
        error,
        loading,
        refresh,
        saveProfile,
        rpc,
        queue,
        accept,
        leave,
        select,
        submit,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSocial() {
  const c = useContext(Context);
  if (!c) throw Error("Social provider missing");
  return c;
}
