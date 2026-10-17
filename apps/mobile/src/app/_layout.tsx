import { SocialProvider } from "../online/Social";
import { Stack } from "expo-router";
export default function Layout() {
  return <SocialProvider><Stack screenOptions={{ headerShown: false }} /></SocialProvider>;
}
