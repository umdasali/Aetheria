import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// Neural network topology by rank — complexity scales with power
const CONFIGS = {
  C: {
    nodes: [
      { x: 0.50, y: 0.15 },
      { x: 0.20, y: 0.80 },
      { x: 0.80, y: 0.80 },
    ],
    edges: [[0,1],[1,2],[0,2]],
    nodeR: 9,
    pulseDur: 1800,
  },
  B: {
    nodes: [
      { x: 0.50, y: 0.08 },
      { x: 0.88, y: 0.38 },
      { x: 0.74, y: 0.86 },
      { x: 0.26, y: 0.86 },
      { x: 0.12, y: 0.38 },
    ],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[1,3],[2,4],[0,3]],
    nodeR: 7,
    pulseDur: 1500,
  },
  A: {
    nodes: [
      { x: 0.50, y: 0.05 }, { x: 0.82, y: 0.21 }, { x: 0.96, y: 0.54 },
      { x: 0.78, y: 0.88 }, { x: 0.50, y: 0.96 }, { x: 0.22, y: 0.88 },
      { x: 0.04, y: 0.54 }, { x: 0.18, y: 0.21 },
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],
      [0,4],[1,5],[2,6],[3,7],[0,2],[4,6],
    ],
    nodeR: 6,
    pulseDur: 1200,
  },
  S: {
    nodes: [
      { x: 0.50, y: 0.04 }, { x: 0.76, y: 0.12 }, { x: 0.94, y: 0.34 },
      { x: 0.94, y: 0.62 }, { x: 0.76, y: 0.86 }, { x: 0.50, y: 0.95 },
      { x: 0.24, y: 0.86 }, { x: 0.06, y: 0.62 }, { x: 0.06, y: 0.34 },
      { x: 0.24, y: 0.12 }, { x: 0.50, y: 0.50 }, { x: 0.50, y: 0.28 },
    ],
    edges: [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0],
      [0,5],[1,6],[2,7],[3,8],[4,9],
      [10,0],[10,2],[10,4],[10,6],[10,8],[11,0],[11,1],[11,9],[11,10],
    ],
    nodeR: 6,
    pulseDur: 1000,
  },
  SOVEREIGN: {
    nodes: [
      // Outer ring (0-11)
      { x: 0.50, y: 0.03 }, { x: 0.75, y: 0.09 }, { x: 0.94, y: 0.27 },
      { x: 0.98, y: 0.50 }, { x: 0.94, y: 0.73 }, { x: 0.75, y: 0.91 },
      { x: 0.50, y: 0.97 }, { x: 0.25, y: 0.91 }, { x: 0.06, y: 0.73 },
      { x: 0.02, y: 0.50 }, { x: 0.06, y: 0.27 }, { x: 0.25, y: 0.09 },
      // Mid ring (12-17)
      { x: 0.50, y: 0.22 }, { x: 0.72, y: 0.36 }, { x: 0.72, y: 0.64 },
      { x: 0.50, y: 0.78 }, { x: 0.28, y: 0.64 }, { x: 0.28, y: 0.36 },
      // Center (18)
      { x: 0.50, y: 0.50 },
    ],
    edges: [
      // Outer ring consecutive
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],
      // Outer → mid (alternate spokes)
      [0,12],[2,13],[4,14],[6,15],[8,16],[10,17],
      // Mid ring
      [12,13],[13,14],[14,15],[15,16],[16,17],[17,12],
      // Mid → center
      [12,18],[13,18],[14,18],[15,18],[16,18],[17,18],
    ],
    nodeR: 5,
    pulseDur: 750,
  },
};

export default function NeuralNetworkViz({ rank, isSovereign, color, glowColor, active }) {
  const cfgKey = isSovereign ? 'SOVEREIGN' : (CONFIGS[rank] ? rank : 'C');
  const cfg = CONFIGS[cfgKey];
  const isSov = cfgKey === 'SOVEREIGN';

  const [size, setSize] = useState({ w: 0, h: 0 });

  // Per-node opacity pulse
  const nodePulse = useRef(cfg.nodes.map((_, i) => new Animated.Value(i % 2 === 0 ? 0.7 : 0.3))).current;
  // Per-edge travel progress (0→1)
  const edgePulse = useRef(cfg.edges.map(() => new Animated.Value(0))).current;
  // Ambient center glow (SOVEREIGN only)
  const centerGlow = useRef(new Animated.Value(0.15)).current;
  // Flash overlay on activation
  const flashAnim = useRef(new Animated.Value(0)).current;
  // Skip burst on initial mount / remount
  const firstRender = useRef(true);

  // Start idle animations on mount
  useEffect(() => {
    const timers = [];
    const loops = [];

    cfg.nodes.forEach((_, i) => {
      const delay = Math.round((i * 1100) / cfg.nodes.length);
      const t = setTimeout(() => {
        const halfDur = Math.round(cfg.pulseDur * 0.52);
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(nodePulse[i], { toValue: 1, duration: halfDur, useNativeDriver: true }),
            Animated.timing(nodePulse[i], { toValue: 0.18, duration: halfDur, useNativeDriver: true }),
          ])
        );
        loop.start();
        loops.push(loop);
      }, delay);
      timers.push(t);
    });

    cfg.edges.forEach((_, i) => {
      const delay = Math.round((i * cfg.pulseDur) / cfg.edges.length);
      const t = setTimeout(() => {
        edgePulse[i].setValue(0);
        const loop = Animated.loop(
          Animated.timing(edgePulse[i], {
            toValue: 1,
            duration: cfg.pulseDur,
            useNativeDriver: true,
          })
        );
        loop.start();
        loops.push(loop);
      }, delay);
      timers.push(t);
    });

    if (isSov) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(centerGlow, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(centerGlow, { toValue: 0.15, duration: 1100, useNativeDriver: true }),
        ])
      );
      loop.start();
      loops.push(loop);
    }

    return () => {
      timers.forEach(clearTimeout);
      loops.forEach(l => l.stop());
      nodePulse.forEach(a => a.stopAnimation());
      edgePulse.forEach(a => a.stopAnimation());
      centerGlow.stopAnimation();
    };
  }, []);

  // Burst flash when fusion/transcend fires — skip on initial mount / remount
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!active) return;
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.75, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [active]);

  const onLayout = useCallback(e => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }, []);

  const abs = cfg.nodes.map(n => ({ x: n.x * size.w, y: n.y * size.h }));
  const r = cfg.nodeR;
  const centerNode = isSov ? abs[18] : null;

  return (
    <View style={{ width: '100%', height: 160 }} onLayout={onLayout}>
      {size.w > 0 && (
        <>
          {/* SOVEREIGN: ambient center glow */}
          {isSov && centerNode && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: centerNode.x - 50,
                top: centerNode.y - 50,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: glowColor,
                opacity: centerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.20] }),
              }}
            />
          )}

          {/* Static edge lines */}
          {cfg.edges.map(([a, b], i) => {
            const n1 = abs[a], n2 = abs[b];
            if (!n1 || !n2) return null;
            const dx = n2.x - n1.x, dy = n2.y - n1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const cx = (n1.x + n2.x) / 2;
            const cy = (n1.y + n2.y) / 2;
            return (
              <View
                key={`e${i}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: cx - len / 2,
                  top: cy - 0.5,
                  width: len,
                  height: 1,
                  backgroundColor: color + '40',
                  transform: [{ rotate: `${angle}deg` }],
                }}
              />
            );
          })}

          {/* Electric pulse dots travelling along each edge */}
          {cfg.edges.map(([a, b], i) => {
            const n1 = abs[a], n2 = abs[b];
            if (!n1 || !n2) return null;
            const anim = edgePulse[i];
            return (
              <Animated.View
                key={`p${i}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: n1.x - 4,
                  top: n1.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: glowColor,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.08, 0.92, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, n2.x - n1.x] }) },
                    { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, n2.y - n1.y] }) },
                  ],
                }}
              />
            );
          })}

          {/* Nodes */}
          {abs.map((n, i) => (
            <Animated.View
              key={`n${i}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: n.x - r,
                top: n.y - r,
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                backgroundColor: color,
                borderWidth: isSov ? 1.5 : 1,
                borderColor: glowColor,
                opacity: nodePulse[i],
              }}
            />
          ))}

          {/* Activation flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 12,
              backgroundColor: glowColor,
              opacity: flashAnim,
            }}
          />
        </>
      )}
    </View>
  );
}
