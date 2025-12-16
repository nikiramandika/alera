import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

const { width } = Dimensions.get("window");

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;

  const backgroundColor = useThemeColor({}, "gradientStart");
  const breathingCircleColor = useThemeColor({}, "primary");

  useEffect(() => {
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]);

    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    entranceAnimation.start(() => breathingAnimation.start());

    return () => breathingAnimation.stop();
  }, [fadeAnim, scaleAnim, breathingScale]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View
        style={[
          styles.breathingCircle,
          {
            backgroundColor: breathingCircleColor,
            opacity: fadeAnim,
            transform: [{ scale: breathingScale }],
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        Welcome
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  breathingCircle: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
  },
  title: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default SplashScreen;
