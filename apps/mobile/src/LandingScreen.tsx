import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Character, STORIES } from "./Character";
import { Button, styles, C } from "./ui";
import { ProfileIcon } from "./ProfileScreen";
import { GameNav, IconButton } from "./Doodle";
import { Tree } from "./Scenery";
export function LandingScreen({
  name,
  photo,
  avatar = -1,
  onProfile,
  onGems,
  gems,
  game,
  next,
  reducedMotion,
  onGame,
  onJourney,
  onFriends,
  onOnline,
  onFamily,
  onRanks,
  onSettings,
}: {
  name: string;
  photo?: string;
  avatar?: number;
  onProfile: () => void;
  onGems: () => void;
  gems: number;
  game: "maze" | "zip";
  next: number;
  reducedMotion: boolean;
  onGame: (g: "maze" | "zip") => void;
  onJourney: () => void;
  onFriends: () => void;
  onOnline: () => void;
  onFamily: () => void;
  onRanks: () => void;
  onSettings: () => void;
}) {
  const small = useWindowDimensions().height < 680;
  const story = Math.floor(next / 10) % STORIES.length;
  const theme = STORIES[story];
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: "space-between",
        gap: small ? 8 : 14,
        backgroundColor: "#EEF2E5",
      }}
    >
      <View style={styles.between}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={onProfile}
          style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
        >
          <ProfileIcon photo={photo} story={story} size={30} />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: C.ink,
              maxWidth: 115,
            }}
          >
            {name}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open gems and themes"
          onPress={onGems}
        >
          <Text
            accessibilityLabel={`${gems} gems`}
            style={{
              backgroundColor: "#FFF6DD",
              borderRadius: 16,
              padding: 10,
              fontWeight: "900",
              color: "#6C4C23",
            }}
          >
            💎 {gems}
          </Text>
        </Pressable>
        <IconButton name="settings" label="Settings" onPress={onSettings} />
      </View>
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: small ? 23 : 29,
            fontFamily: "DangalTitle",
            textShadowColor: "#FFF1BD",
            textShadowOffset: { width: 2, height: 3 },
            textShadowRadius: 1,
            fontWeight: "900",
            letterSpacing: -1,
            color: "#294936",
          }}
        >
          DIMAG KA DANGAL
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: C.muted,
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          PUZZLE ADVENTURES
        </Text>
      </View>
      <View
        style={{
          height: small ? 155 : 235,
          borderRadius: 35,
          backgroundColor: game === "maze" ? theme.sky : "#BDA6DB",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: "#FFFFFF",
        }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: i * 135 - 35,
              top: i % 2 ? 40 : 10,
              width: 115,
              height: 34,
              borderRadius: 60,
              backgroundColor: "#FFFFFF44",
              transform: [{ rotate: "-8deg" }],
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            bottom: -40,
            left: -35,
            width: 240,
            height: 130,
            borderRadius: 120,
            backgroundColor: "#91B886",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -60,
            right: -50,
            width: 250,
            height: 150,
            borderRadius: 120,
            backgroundColor: "#749D80",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 15,
            left: small ? 50 : 75,
            width: 210,
            height: 39,
            borderRadius: 100,
            backgroundColor: "#6E806A",
            borderTopWidth: 15,
            borderColor: "#D2E5AC",
            transform: [{ rotate: "-4deg" }],
          }}
        />
        <View style={{ position: "absolute", bottom: 32, left: 23 }}>
          <Tree />
        </View>
        <View style={{ position: "absolute", right: 18, bottom: 40 }}>
          <Tree small />
        </View>
        <View style={{ marginTop: small ? -16 : -12 }}>
          <Character
            game={game}
            story={avatar >= 0 ? avatar : story}
            size={small ? 105 : 145}
            animate
            reducedMotion={reducedMotion}
          />
        </View>
        <Text
          style={{
            position: "absolute",
            bottom: 6,
            fontSize: 11,
            fontWeight: "800",
            color: "#FFF",
          }}
        >
          {game === "maze" ? theme.name : "Lumi"} ·{" "}
          {game === "maze" ? theme.title : "Starlight Trail"}
        </Text>
      </View>
      <View style={styles.row}>
        {(["zip", "maze"] as const).map((g) => (
          <Pressable
            key={g}
            accessibilityRole="button"
            accessibilityLabel={
              g === "zip" ? "Select Number Trail" : "Select Maze Runner"
            }
            accessibilityState={{ selected: game === g }}
            onPress={() => onGame(g)}
            style={{
              flex: 1,
              padding: small ? 10 : 14,
              borderRadius: 19,
              backgroundColor: game === g ? "#D4E4B8" : "#FCFBF2",
              borderWidth: 2,
              borderColor: game === g ? "#8BA768" : "#DEE6D0",
              gap: 3,
            }}
          >
            <Text
              style={{
                fontSize: small ? 13 : 15,
                fontWeight: "900",
                color: C.ink,
              }}
            >
              {g === "zip" ? "① → ②  Trail" : "▥  Maze"}
            </Text>
            <Text style={{ fontSize: 10, color: C.muted }}>
              {g === "zip" ? "Connect every number" : "Guide your companion"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button label={`Play · Puzzle ${next + 1} →`} onPress={onJourney} />
      <GameNav
        onFriends={onFriends}
        onOnline={onOnline}
        onFamily={onFamily}
        onRanks={onRanks}
        onSettings={onSettings}
      />
    </View>
  );
}
