import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

interface LoadingAnimationProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ size = 'medium' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breathingScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Initial entrance animation
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(breathingScale, {
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
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Start breathing animation after entrance
    setTimeout(() => {
      breathingAnimation.start();
    }, 400);

    return () => {
      breathingAnimation.stop();
    };
  }, []);

  // Size configurations
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          logoSize: width * 0.15, // 15% of screen width
          circleSize: width * 0.2, // 20% of screen width
        };
      case 'large':
        return {
          logoSize: width * 0.4, // 40% of screen width
          circleSize: width * 0.5, // 50% of screen width
        };
      case 'medium':
      default:
        return {
          logoSize: width * 0.25, // 25% of screen width
          circleSize: width * 0.35, // 35% of screen width
        };
    }
  };

  const { logoSize, circleSize } = getSizeConfig();

  const styles = createStyles(logoSize, circleSize);

  return (
    <View style={styles.container}>
      {/* Breathing circles in background - sekarang di belakang logo */}
      <View style={styles.circlesContainer}>
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

      {/* Logo di atas circles */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: breathingScale }],
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
    </View>
  );
};

const createStyles = (logoSize: number, circleSize: number) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 200,
  },
  circlesContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: logoSize,
    height: logoSize,
    maxWidth: 150,
    maxHeight: 150,
  },
  breathingCircle: {
    position: 'absolute',
    borderRadius: 9999, // Circular shape
    opacity: 0.08,
  },
  breathingCircle1: {
    width: circleSize,
    height: circleSize,
    backgroundColor: '#84CC16',
  },
  breathingCircle2: {
    width: circleSize * 0.7,
    height: circleSize * 0.7,
    backgroundColor: '#65A30D',
  },
});

export default LoadingAnimation;