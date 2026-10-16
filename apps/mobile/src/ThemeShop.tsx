import React from "react";
import { Text, View } from "react-native";
import { Wallet, SHOP, ThemeId, buyTheme } from "./engine/rewards";
import { THEMES } from "./themes";
import { Button, styles } from "./ui";
export function ThemeShop({
  wallet,
  onChange,
}: {
  wallet: Wallet;
  onChange: (w: Wallet) => void;
}) {
  const wins = wallet.claimed.filter((k) => !k.startsWith("chapter:")).length;
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.h2}>Themes · ◆ {wallet.gems}</Text>
      <Button
        label={
          wallet.selected === "auto" ? "✓ Chapter themes" : "Use chapter themes"
        }
        secondary
        onPress={() => onChange({ ...wallet, selected: "auto" })}
      />
      {SHOP.map((item) => {
        const theme = THEMES[item.id],
          owned = wallet.themes.includes(item.id),
          eligible = wins >= item.wins && wallet.gems >= item.cost;
        return (
          <View
            key={item.id}
            style={{
              backgroundColor: theme.ground,
              borderRadius: 18,
              padding: 16,
              gap: 10,
              borderColor: theme.wall,
              borderWidth: 1,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[theme.wall, theme.path, theme.accent].map((c) => (
                <View
                  key={c}
                  style={{
                    backgroundColor: c,
                    width: 26,
                    height: 26,
                    borderRadius: 10,
                  }}
                />
              ))}
            </View>
            <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "800" }}>
              {item.name}
            </Text>
            <Button
              label={
                owned
                  ? wallet.selected === item.id
                    ? "✓ Equipped"
                    : "Equip"
                  : `Unlock · ◆ ${item.cost} · ${item.wins} wins`
              }
              disabled={!owned && !eligible}
              onPress={() => onChange(buyTheme(wallet, item.id as ThemeId))}
            />
          </View>
        );
      })}
    </View>
  );
}
