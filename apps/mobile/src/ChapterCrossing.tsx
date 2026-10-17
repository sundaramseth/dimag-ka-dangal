import React, { useEffect, useState } from "react";
import { Animated, View, Text } from "react-native";
import { Character, STORIES } from "./Character";
import { Doodle } from "./Doodle";
import { Button, styles } from "./ui";
export function ChapterCrossing({
  chapter,
  reducedMotion,
  onEnter,
}: {
  chapter: number;
  reducedMotion: boolean;
  onEnter: () => void;
}) {
  const [travel] = useState(() => new Animated.Value(0)),
    [ready, setReady] = useState(reducedMotion);
  const boat = chapter % 2 === 0,
    story = STORIES[chapter % STORIES.length];
  useEffect(() => {
    const a = Animated.timing(travel, {
      toValue: 1,
      duration: reducedMotion ? 0 : 1800,
      useNativeDriver: true,
    });
    a.start(({ finished }) => {
      if (finished) setReady(true);
    });
    return () => a.stop();
  }, [travel, reducedMotion]);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        gap: 24,
        backgroundColor: story.ground,
      }}
    >
      <Text style={styles.title}>
        {boat ? "Across the lagoon" : "Across the sky bridge"}
      </Text>
      <Text style={styles.h2}>
        Chapter {chapter + 1} · {story.title}
      </Text>
      <View
        style={{
          height: 180,
          justifyContent: "center",
          backgroundColor: boat ? "#81BBCD" : "#B8CEE1",
          borderRadius: 25,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 120,
            height: boat ? 15 : 18,
            backgroundColor: boat ? "#D3F4F2" : "#A88055",
          }}
        />
        <Animated.View
          style={{
            transform: [
              {
                translateX: travel.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 180],
                }),
              },
            ],
            width: 90,
            alignItems: "center",
          }}
        >
          <Character
            story={chapter}
            size={68}
            animate={!reducedMotion}
            mood="happy"
          />
          <Doodle name={boat ? "boat" : "gate"} size={55} />
        </Animated.View>
      </View>
      <Text style={styles.text}>{story.role}</Text>
      <Button
        label={ready ? "Enter chapter →" : "Travelling…"}
        disabled={!ready}
        onPress={onEnter}
      />
    </View>
  );
}
