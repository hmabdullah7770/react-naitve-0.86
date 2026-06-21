import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
  Easing,
} from 'react-native-reanimated';

const GOLD = '#f98e0c';

// ── Single bouncing dot ───────────────────────────────────────────────────────
const BounceDot = ({ delay = 0 }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 280, easing: Easing.out(Easing.quad) }),
          withSpring(0, { damping: 6, stiffness: 180 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
};

// ── Star pulse ────────────────────────────────────────────────────────────────
const StarIcon = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(0.8, { duration: 200, easing: Easing.in(Easing.quad) }),
        withTiming(1,   { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(1,   { duration: 500 }), // pause
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1,   { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={starStyle}>
      <Text style={styles.starEmoji}>⭐</Text>
    </Animated.View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const RemoveFavouretLoader = () => {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={styles.overlay}
    >
      <View style={styles.card}>

        {/* Star icon */}
        <StarIcon />

        {/* Bouncing dots */}
        <View style={styles.dotsRow}>
          <BounceDot delay={0} />
          <BounceDot delay={150} />
          <BounceDot delay={300} />
        </View>

        <Text style={styles.label}>Removing from Favouret…</Text>
      </View>
    </Animated.View>
  );
};

export default RemoveFavouretLoader;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    borderRadius: 14,
  },
  card: {
    alignItems: 'center',
    gap: 10,
  },
  starEmoji: {
    fontSize: 36,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
    height: 22,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  label: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});