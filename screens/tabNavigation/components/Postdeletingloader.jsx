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

const RED = '#E53935';

// ── Single bouncing dot ───────────────────────────────────────────────────────
const BounceDot = ({ delay = 0 }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 280, easing: Easing.out(Easing.quad) }),
          withSpring(0, { damping: 6, stiffness: 180 }), // snappy spring back = native feel
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

// ── Trash lid flap ────────────────────────────────────────────────────────────
const TrashLid = () => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 250, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(0,   { duration: 250, easing: Easing.in(Easing.back(1)) }),
        withTiming(0,   { duration: 700 }), // pause between flaps
      ),
      -1,
      false,
    );
  }, []);

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.trashLidWrapper, lidStyle]}>
      <View style={styles.trashHandle} />
      <View style={styles.trashLid} />
    </Animated.View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const PostDeletingLoader = () => {
  console.log('PostDeletingLoader rendered');

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={styles.overlay}
    >
      <View style={styles.card}>

        {/* Trash icon */}
        <View style={styles.iconWrapper}>
          <TrashLid />
          <View style={styles.trashBody}>
            <View style={styles.trashLine} />
            <View style={styles.trashLine} />
            <View style={styles.trashLine} />
          </View>
        </View>

        {/* Bouncing dots — staggered via withDelay */}
        <View style={styles.dotsRow}>
          <BounceDot delay={0} />
          <BounceDot delay={150} />
          <BounceDot delay={300} />
        </View>

        <Text style={styles.label}>Deleting post…</Text>
      </View>
    </Animated.View>
  );
};

export default PostDeletingLoader;

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

  // ── Trash icon ──
  iconWrapper: {
    alignItems: 'center',
    gap: 2,
  },
  trashLidWrapper: {
    alignItems: 'center',
  },
  trashHandle: {
    width: 10,
    height: 4,
    backgroundColor: RED,
    borderRadius: 2,
    marginBottom: 2,
  },
  trashLid: {
    width: 26,
    height: 4,
    backgroundColor: RED,
    borderRadius: 2,
  },
  trashBody: {
    width: 22,
    height: 26,
    borderWidth: 2.5,
    borderColor: RED,
    borderTopWidth: 0,
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 4,
    overflow: 'hidden',
  },
  trashLine: {
    width: 2.5,
    height: 13,
    backgroundColor: RED,
    borderRadius: 2,
  },

  // ── Dots ──
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
    backgroundColor: RED,
  },

  // ── Label ──
  label: {
    fontSize: 13,
    color: RED,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});


// import React, { useEffect, useRef } from 'react';
// import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

// const PostDeletingLoader = () => {

//     console.log('PostDeletingLoader rendered');
    
//   const dot1 = useRef(new Animated.Value(0)).current;
//   const dot2 = useRef(new Animated.Value(0)).current;
//   const dot3 = useRef(new Animated.Value(0)).current;
//   const fadeIn = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     // Fade in overlay
//     Animated.timing(fadeIn, {
//       toValue: 1,
//       duration: 200,
//       useNativeDriver: true,
//     }).start();

//     // Bouncing dots loop
//     const animateDot = (dot, delay) =>
//       Animated.loop(
//         Animated.sequence([
//           Animated.delay(delay),
//           Animated.timing(dot, {
//             toValue: -8,
//             duration: 300,
//             easing: Easing.out(Easing.quad),
//             useNativeDriver: true,
//           }),
//           Animated.timing(dot, {
//             toValue: 0,
//             duration: 300,
//             easing: Easing.in(Easing.quad),
//             useNativeDriver: true,
//           }),
//           Animated.delay(600 - delay),
//         ])
//       );

//     const a1 = animateDot(dot1, 0);
//     const a2 = animateDot(dot2, 150);
//     const a3 = animateDot(dot3, 300);

//     a1.start();
//     a2.start();
//     a3.start();

//     return () => {
//       a1.stop();
//       a2.stop();
//       a3.stop();
//     };
//   }, []);

//   return (
//     <Animated.View style={[styles.overlay, { opacity: fadeIn }]}>
//       <View style={styles.card}>
//         {/* Trash icon using pure shapes */}
//         <View style={styles.iconWrapper}>
//           <View style={styles.trashLid} />
//           <View style={styles.trashBody}>
//             <View style={styles.trashLine} />
//             <View style={styles.trashLine} />
//             <View style={styles.trashLine} />
//           </View>
//         </View>

//         {/* Bouncing dots */}
//         <View style={styles.dotsRow}>
//           {[dot1, dot2, dot3].map((dot, i) => (
//             <Animated.View
//               key={i}
//               style={[styles.dot, { transform: [{ translateY: dot }] }]}
//             />
//           ))}
//         </View>

//         <Text style={styles.label}>Deleting post…</Text>
//       </View>
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(255, 255, 255, 0.82)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 99,
//     borderRadius: 8,
//   },
//   card: {
//     alignItems: 'center',
//     gap: 10,
//   },

//   // Trash icon
//   iconWrapper: {
//     alignItems: 'center',
//     marginBottom: 2,
//   },
//   trashLid: {
//     width: 26,
//     height: 5,
//     backgroundColor: '#E53935',
//     borderRadius: 2,
//     marginBottom: 2,
//   },
//   trashBody: {
//     width: 22,
//     height: 26,
//     borderWidth: 2,
//     borderColor: '#E53935',
//     borderTopWidth: 0,
//     borderRadius: 2,
//     flexDirection: 'row',
//     justifyContent: 'space-evenly',
//     alignItems: 'center',
//     paddingTop: 4,
//     overflow: 'hidden',
//   },
//   trashLine: {
//     width: 2,
//     height: 14,
//     backgroundColor: '#E53935',
//     borderRadius: 1,
//   },

//   // Bouncing dots
//   dotsRow: {
//     flexDirection: 'row',
//     gap: 6,
//     alignItems: 'flex-end',
//     height: 20,
//   },
//   dot: {
//     width: 7,
//     height: 7,
//     borderRadius: 4,
//     backgroundColor: '#E53935',
//   },

//   label: {
//     fontSize: 13,
//     color: '#E53935',
//     fontWeight: '500',
//     letterSpacing: 0.2,
//   },
// });

// export default PostDeletingLoader;