// ProductDeleteLoader.jsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

// ── Ripple ring (runs entirely on UI thread) ──────────────────────────────────
const RippleRing = ({ delay = 0 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.3, 2.2]) }],
    opacity: interpolate(progress.value, [0, 0.4, 1], [0.6, 0.25, 0]),
  }));

  return <Animated.View style={[styles.ring, animStyle]} />;
};

// ── Trash lid flap ────────────────────────────────────────────────────────────
const TrashIcon = () => {
  const lidRotate = useSharedValue(0);
  const bodyScale = useSharedValue(1);

  useEffect(() => {
    // Lid flaps open/close
    lidRotate.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(0,   { duration: 300, easing: Easing.in(Easing.back(1)) }),
        withTiming(0,   { duration: 500 }), // pause
      ),
      -1,
      false,
    );

    // Body breathes
    bodyScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lidRotate.value}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bodyScale.value }],
  }));

  return (
    <View style={styles.trashWrapper}>
      {/* Lid */}
      <Animated.View style={[styles.trashLidRow, lidStyle]}>
        <View style={styles.trashHandle} />
        <View style={styles.trashLid} />
      </Animated.View>

      {/* Body */}
      <Animated.View style={[styles.trashBody, bodyStyle]}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </Animated.View>
    </View>
  );
};

// ── Main overlay ──────────────────────────────────────────────────────────────
const ProductDeleteLoader = () => {
  const dotOpacity1 = useSharedValue(0.3);
  const dotOpacity2 = useSharedValue(0.3);
  const dotOpacity3 = useSharedValue(0.3);

  useEffect(() => {
    const cfg = { duration: 400, easing: Easing.inOut(Easing.ease) };
    dotOpacity1.value = withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1);
    dotOpacity2.value = withDelay(160, withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1));
    dotOpacity3.value = withDelay(320, withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1));
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dotOpacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dotOpacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dotOpacity3.value }));

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.overlay}>
      {/* Ripple rings — staggered */}
      <RippleRing delay={0} />
      <RippleRing delay={700} />

      {/* Icon circle */}
      <View style={styles.iconCircle}>
        <TrashIcon />
      </View>

      {/* "Deleting" label with animated dots */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Deleting</Text>
        <Animated.Text style={[styles.dot, dot1Style]}>•</Animated.Text>
        <Animated.Text style={[styles.dot, dot2Style]}>•</Animated.Text>
        <Animated.Text style={[styles.dot, dot3Style]}>•</Animated.Text>
      </View>
    </Animated.View>
  );
};

export default ProductDeleteLoader;

const RED = '#e53935';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    zIndex: 99,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: RED,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  trashWrapper: {
    alignItems: 'center',
    gap: 2,
  },
  trashLidRow: {
    alignItems: 'center',
    transformOrigin: 'left', // pivot from left for flap feel
  },
  trashHandle: {
    width: 8,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginBottom: 1,
  },
  trashLid: {
    width: 20,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  trashBody: {
    width: 16,
    height: 14,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  trashLine: {
    width: 2,
    height: 7,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: RED,
    letterSpacing: 0.5,
    marginRight: 2,
  },
  dot: {
    fontSize: 14,
    color: RED,
    fontWeight: '900',
  },
});