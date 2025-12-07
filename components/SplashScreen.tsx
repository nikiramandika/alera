import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;

  // Get theme colors dynamically
  const backgroundColor = useThemeColor({}, 'gradientStart');
  const breathingCircleColor = useThemeColor({}, 'primary');

  useEffect(() => {
    // Initial entrance animation
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();

    // Breathing animation loop
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Start breathing animation after entrance
    setTimeout(() => {
      breathingAnimation.start();
    }, 600);

    return () => {
      breathingAnimation.stop();
    };
  }, [breathingScale, fadeAnim, scaleAnim]);

  const styles = createStyles(backgroundColor, breathingCircleColor);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: breathingScale },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/aleraLogo.png')}
          style={styles.logo}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>

      {/* Breathing circles in background */}
      <Animated.View
        style={[
          styles.breathingCircle,
          styles.breathingCircle1,
          {
            transform: [{ scale: breathingScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.breathingCircle,
          styles.breathingCircle2,
          {
            transform: [{ scale: breathingScale }],
          },
        ]}
      />
    </View>
  );
};

const createStyles = (backgroundColor: string, breathingCircleColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor, // Dynamic background based on theme
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: width * 0.5, // 50% of screen width
    height: width * 0.5, // Keep it square
    maxWidth: 200,
    maxHeight: 200,
  },
  breathingCircle: {
    position: 'absolute',
    borderRadius: width * 0.6,
    opacity: 0.1,
  },
  breathingCircle1: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: breathingCircleColor, // Dynamic color based on theme
    top: '50%',
    left: '50%',
    marginTop: -(width * 0.3),
    marginLeft: -(width * 0.3),
  },
  breathingCircle2: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: breathingCircleColor, // Dynamic color based on theme
    top: '50%',
    left: '50%',
    marginTop: -(width * 0.2),
    marginLeft: -(width * 0.2),
  },
});

export default SplashScreen;