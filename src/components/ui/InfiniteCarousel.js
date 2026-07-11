import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, View, TouchableOpacity } from 'react-native';

// ── InfiniteCarousel ─────────────────────────────────────────────────────────
// Infinitely-looping horizontal row. Two visual modes:
//   focusMode=false (default) — every card renders at full, uniform size, no
//     single "focused" card; each card owns its own tap handling.
//   focusMode=true — a spotlight carousel: the centered card scales up to full
//     opacity while neighbors shrink/dim (driven continuously off scroll
//     position), tapping a peeking neighbor scrolls it to center instead of
//     firing onCenterPress, and an optional glow renders behind the center item.
// Either way, swiping never runs out in either direction.
//
// Looping trick: the real `data` array is stitched into REPEAT back-to-back
// virtual copies, and the list starts scrolled to the middle copy. Swiping far
// enough in one direction silently re-centers (no animation) once it nears
// either end of the virtual range, so it never actually runs out.
//
// Props:
//   data           — real items array
//   renderCard     — ({ item, index, isCenter, centerProgress }) => JSX.
//                    isCenter/centerProgress are focusMode-only: centerProgress
//                    is an Animated interpolation running 0→1 as the item
//                    scrolls into the exact center — cards use it to fade in
//                    their own spotlight chrome (halo, CTA) in lockstep with
//                    the scroll instead of popping at the midpoint.
//   cardW, cardH   — fixed card size
//   gap            — spacing between cards (default 10)
//   containerWidth — measured width of the carousel's parent, used to center
//   initialIndex   — starting real index (default 0)
//   focusMode      — enables the spotlight scale/dim/tap-to-center behavior (default false)
//   onCenterPress  — (focusMode only) fires when the centered card is tapped
const REPEAT = 61;

function InfiniteCarousel({
  data,
  renderCard,
  cardW,
  cardH,
  gap = 10,
  containerWidth,
  initialIndex = 0,
  focusMode = false,
  onCenterPress,
}) {
  const listRef = useRef(null);
  const step = cardW + gap;
  const count = data.length;
  const virtualLength = count * REPEAT;
  const middleBase = Math.floor(REPEAT / 2) * count;
  const sidePad = Math.max(0, (containerWidth - cardW) / 2);
  const startReal = ((initialIndex % count) + count) % count;
  const didInitRef = useRef(false);

  const [centerIndex, setCenterIndex] = useState(startReal);
  const centerRef = useRef(startReal);
  const scrollX = useRef(new Animated.Value((middleBase + startReal) * step)).current;
  const lastXRef = useRef((middleBase + startReal) * step);
  const idleTimerRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }, []);

  const virtualIndices = useMemo(() => Array.from({ length: virtualLength }, (_, i) => i), [virtualLength]);
  const realIndexOf = useCallback((vIdx) => ((vIdx % count) + count) % count, [count]);
  const getItemLayout = useCallback((_, index) => ({ length: step, offset: step * index, index }), [step]);

  // initialScrollIndex isn't reliably honored by react-native-web's FlatList,
  // so once the list has its real layout, force-jump to the middle copy —
  // this is what actually makes the loop feel infinite in both directions.
  // Fires exactly once per mount — the parent remounts this component (via a
  // cardW-inclusive `key`) whenever measured card size settles, so `step` is
  // already stable by the time this runs; calling scrollToOffset repeatedly
  // as layout passes land was observed to desync react-native-web's FlatList
  // virtualization window from the actual scroll position.
  const handleListLayout = useCallback(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const target = (middleBase + startReal) * step;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: target, animated: false });
    });
  }, [middleBase, startReal, step]);

  // snapToInterval is a no-op on react-native-web and momentum events never
  // fire for wheel/trackpad scrolls there, so snapping is driven off scroll
  // *idleness* instead: every scroll event re-arms a short timer, and when
  // events stop arriving the list eases onto the nearest card. On native the
  // interval snap already landed on-grid, so the idle snap is a no-op there —
  // and it's suppressed entirely while a finger is still down (drag guard).
  const scheduleIdleSnap = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (draggingRef.current) return;
      const x = lastXRef.current;
      const snapped = Math.round(x / step) * step;
      if (Math.abs(x - snapped) > 1) {
        listRef.current?.scrollToOffset({ offset: snapped, animated: true });
      }
    }, 150);
  }, [step]);

  const trackScroll = useCallback((x) => {
    lastXRef.current = x;
    if (focusMode) {
      const real = realIndexOf(Math.round(x / step));
      if (real !== centerRef.current) {
        centerRef.current = real;
        setCenterIndex(real);
      }
    }
    scheduleIdleSnap();
  }, [focusMode, step, realIndexOf, scheduleIdleSnap]);

  const handleScroll = useMemo(() => (focusMode
    ? Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: true, listener: (e) => trackScroll(e.nativeEvent.contentOffset.x) },
    )
    : (e) => trackScroll(e.nativeEvent.contentOffset.x)
  ), [focusMode, scrollX, trackScroll]);

  const handleDragBegin = useCallback(() => { draggingRef.current = true; }, []);
  const handleDragEnd = useCallback(() => { draggingRef.current = false; scheduleIdleSnap(); }, [scheduleIdleSnap]);

  const handleMomentumEnd = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    const vIdx = Math.round(x / step);
    const lowT = count * 5;
    const highT = virtualLength - count * 5;
    if (vIdx < lowT || vIdx > highT) {
      const recenteredV = middleBase + realIndexOf(vIdx);
      listRef.current?.scrollToOffset({ offset: recenteredV * step, animated: false });
      if (focusMode) scrollX.setValue(recenteredV * step);
    }
  }, [step, count, virtualLength, middleBase, realIndexOf, focusMode, scrollX]);

  const handleCardPress = useCallback((vIdx, real) => {
    if (real === centerRef.current) {
      onCenterPress && onCenterPress(real);
    } else {
      listRef.current?.scrollToIndex({ index: vIdx, animated: true });
    }
  }, [onCenterPress]);

  const renderItem = useCallback(({ item: vIdx }) => {
    const real = realIndexOf(vIdx);
    const item = data[real];

    if (!focusMode) {
      return (
        <View style={{ width: cardW, marginRight: gap }}>
          {renderCard({ item, index: real, isCenter: false })}
        </View>
      );
    }

    const offset = vIdx * step;
    const inputRange = [offset - step, offset, offset + step];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.94, 1.06, 0.94], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.45, 1, 0.45], extrapolate: 'clamp' });
    const centerProgress = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={{ width: cardW, marginRight: gap }}
        onPress={() => handleCardPress(vIdx, real)}
      >
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          {renderCard({ item, index: real, isCenter: real === centerIndex, centerProgress })}
        </Animated.View>
      </TouchableOpacity>
    );
  }, [data, realIndexOf, cardW, gap, focusMode, step, scrollX, centerIndex, renderCard, handleCardPress]);

  if (!count) return null;

  // Animated.FlatList is only needed to drive the focusMode scale/opacity
  // interpolation — using it unconditionally (with onScroll omitted when
  // !focusMode) breaks the plain uniform row's internal scroll/virtualization
  // tracking on react-native-web, so pick the component per mode instead.
  const ListComponent = focusMode ? Animated.FlatList : FlatList;

  return (
    <View style={{ height: cardH, alignItems: 'center', justifyContent: 'center' }}>
      <ListComponent
        ref={listRef}
        data={virtualIndices}
        horizontal
        style={{ height: cardH, width: '100%', flexGrow: 0, alignSelf: 'stretch' }}
        keyExtractor={(vIdx) => `v-${vIdx}`}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: sidePad, alignItems: 'center' }}
        getItemLayout={getItemLayout}
        onLayout={handleListLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleDragBegin}
        onScrollEndDrag={handleDragEnd}
        onMomentumScrollEnd={handleMomentumEnd}
        removeClippedSubviews
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={6}
      />
    </View>
  );
}

export default React.memo(InfiniteCarousel);
