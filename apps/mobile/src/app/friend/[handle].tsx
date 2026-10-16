import { Redirect, useLocalSearchParams } from "expo-router";
export default function FriendInvite() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return (
    <Redirect
      href={{
        pathname: "/",
        params: {
          friend: /^[a-z0-9_]{3,24}$/.test(handle || "") ? handle : "",
        },
      }}
    />
  );
}
