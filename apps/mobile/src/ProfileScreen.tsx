import React, { useState } from "react";
import { Image, Text, TextInput, View, Pressable } from "react-native";
import { Character, STORIES } from "./Character";
import { useSocial, type CloudProfile } from "./online/Social";
import { Button, styles, C } from "./ui";
export const countryFlag = (c: string) =>
  /^[A-Z]{2}$/.test(c)
    ? String.fromCodePoint(...[...c].map((x) => 127397 + x.charCodeAt(0)))
    : "";
export function ProfileIcon({
  photo,
  story = 0,
  size = 38,
}: {
  photo?: string;
  story?: number;
  size?: number;
}) {
  const [failed, setFailed] = useState("");
  return photo && failed !== photo ? (
    <Image
      source={{ uri: photo }}
      accessibilityLabel="Google profile photo"
      onError={() => setFailed(photo)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: "#D9B35C",
      }}
    />
  ) : (
    <Character story={story} size={size} />
  );
}
export function ProfileScreen({
  name,
  onLocal,
  onLogin,
}: {
  name: string;
  onLocal: (name: string, avatar: number) => void;
  onLogin: () => void;
}) {
  const s = useSocial();
  const [draft, setDraft] = useState<CloudProfile>(
    () =>
      s.profile || {
        id: "",
        handle: "",
        display_name: name,
        avatar: -1,
        avatar_url: "",
        gender: "",
        country: "",
      },
  );
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const field = (key: "display_name" | "handle" | "country", value: string) =>
    setDraft((p) => ({ ...p, [key]: value }));
  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <ProfileIcon
          photo={s.profile?.avatar_url}
          story={Math.max(0, draft.avatar)}
          size={78}
        />
        <Text style={styles.h2}>
          {draft.display_name} {countryFlag(draft.country)}
        </Text>
        {s.profile && <Text style={styles.subtitle}>@{s.profile.handle}</Text>}
      </View>
      <Text style={styles.label}>PLAYER NAME</Text>
      <TextInput
        accessibilityLabel="Player name"
        value={draft.display_name}
        maxLength={24}
        onChangeText={(v) => field("display_name", v)}
        style={styles.input}
      />
      {!!s.session && (
        <>
          <Text style={styles.label}>UNIQUE USERNAME</Text>
          <TextInput
            accessibilityLabel="Username"
            value={draft.handle}
            maxLength={24}
            autoCapitalize="none"
            onChangeText={(v) =>
              field("handle", v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            style={styles.input}
          />
        </>
      )}
      <Text style={styles.label}>CHOOSE YOUR COMPANION</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          label="Chapter companion"
          secondary={draft.avatar !== -1}
          onPress={() => setDraft((p) => ({ ...p, avatar: -1 }))}
        />
        {STORIES.map((c, i) => (
          <Pressable
            key={c.name}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${c.name}`}
            accessibilityState={{ selected: draft.avatar === i }}
            onPress={() => setDraft((p) => ({ ...p, avatar: i }))}
            style={{
              alignItems: "center",
              padding: 6,
              borderRadius: 12,
              backgroundColor: draft.avatar === i ? "#D7D0EE" : C.panel2,
              borderWidth: 2,
              borderColor: draft.avatar === i ? "#8066A7" : "transparent",
            }}
          >
            <Character size={43} story={i} />
            <Text style={styles.subtitle}>{c.name}</Text>
          </Pressable>
        ))}
      </View>
      {!!s.session && (
        <>
          <Text style={styles.label}>GENDER · OPTIONAL</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {[
              ["", "Skip"],
              ["woman", "Woman"],
              ["man", "Man"],
              ["other", "Other"],
              ["prefer_not", "Private"],
            ].map(([v, label]) => (
              <Button
                key={v}
                label={label}
                secondary={draft.gender !== v}
                onPress={() => setDraft((p) => ({ ...p, gender: v }))}
              />
            ))}
          </View>
          <Text style={styles.label}>COUNTRY CODE · OPTIONAL</Text>
          <TextInput
            accessibilityLabel="Country code"
            placeholder="IN, NP, US…"
            autoCapitalize="characters"
            maxLength={2}
            value={draft.country}
            onChangeText={(v) =>
              field("country", v.toUpperCase().replace(/[^A-Z]/g, ""))
            }
            style={styles.input}
          />
          <Text style={styles.subtitle}>
            Google provides your name and photo. Choose country and gender
            yourself.
          </Text>
        </>
      )}
      <Button
        label={busy ? "Saving…" : "Save profile"}
        disabled={busy || !draft.display_name.trim()}
        onPress={async () => {
          setBusy(true);
          setMessage("");
          try {
            if (s.session) {
              await s.saveProfile(draft);
            }
            onLocal(draft.display_name.trim(), draft.avatar);
            setMessage("Profile saved · updated across the app");
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Save failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      {!s.session && (
        <Button label="Continue with Google / Sign in" onPress={onLogin} />
      )}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {message}
        </Text>
      )}
    </View>
  );
}
