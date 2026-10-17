import { SocialProvider } from "../online/Social";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
export default function Layout() {
  // Keep system fonts available while offline bundled faces load (or if a font fails).
  useFonts({
    DangalTitle: require("../../assets/fonts/DangalTitle.ttf"),
    DangalGame: require("../../assets/fonts/DangalGame.ttf"),
  });
  return (
    <SocialProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SocialProvider>
  );
}
