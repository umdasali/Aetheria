import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getActiveEvents, getUpcomingEvents, getEndedEvents, secondsUntilEnd, secondsUntilStart } from '../data/events';
import { getHeroById } from '../data/heroes';
import { C, RANK } from '../theme/colors';
import HeroCard from '../components/HeroCard';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';

const { width: W, height: H } = Dimensions.get('window');
const EV_HERO_W = Math.round(H * 0.38);

function formatCountdown(seconds) {
  if (seconds <= 0) return 'ENDED';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function EventCard({ event, onEnter, isGuaranteed }) {
  const [secs,      setSecs]      = useState(() => secondsUntilEnd(event));
  const [startSecs, setStartSecs] = useState(() => secondsUntilStart(event));
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      setSecs(secondsUntilEnd(event));
      setStartSecs(secondsUntilStart(event));
    }, 1000);
    return () => clearInterval(id);
  }, [event]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const glowOp = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  const featuredHero = event.featuredHeroId ? getHeroById(event.featuredHeroId) : null;
  const rateUpHeroes = (event.rateUpHeroIds ?? []).map(getHeroById).filter(Boolean);
  const accent       = event.accentColor ?? C.PRIMARY;
  const isUpcoming   = startSecs > 0;
  const isActive     = !isUpcoming && secs > 0;

  return (
    <View style={[s.card, { borderColor: accent + '55' }]}>
      {/* Animated glow border */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, s.cardGlowBorder, { borderColor: accent, opacity: glowOp }]}
      />

      <View style={s.cardInner}>
        {/* LEFT: Featured HeroCard */}
        {featuredHero && (
          <View style={s.cardHeroCol}>
            <HeroCard hero={featuredHero} width={EV_HERO_W} />
          </View>
        )}

        {/* RIGHT: Event info */}
        <View style={[s.cardInfoCol, { borderLeftColor: accent + '33' }]}>

          {/* Name + live badge */}
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardName, { color: accent }]} numberOfLines={1}>
                {event.name.toUpperCase()}
              </Text>
              <Text style={s.cardSubtitle}>{event.subtitle}</Text>
            </View>
            {isActive && (
              <View style={[s.activeBadge, { backgroundColor: accent + '22', borderColor: accent + '88' }]}>
                <View style={[s.activeDot, { backgroundColor: accent }]} />
                <Text style={[s.activeTxt, { color: accent }]}>LIVE</Text>
              </View>
            )}
          </View>

          {/* Countdown */}
          <View style={s.countdownRow}>
            <Ionicons name="time-outline" size={13} color={C.TEXT_MUTED} />
            <Text style={s.countdownLabel}>
              {isUpcoming ? 'STARTS IN' : isActive ? 'ENDS IN' : 'ENDED'}
            </Text>
            {(isUpcoming || isActive) && (
              <Text style={[s.countdownValue, isActive && secs < 3600 && { color: C.DANGER }]}>
                {isUpcoming ? formatCountdown(startSecs) : formatCountdown(secs)}
              </Text>
            )}
          </View>

          {/* Rate-up heroes */}
          {rateUpHeroes.length > 0 && (
            <View style={s.rateUpRow}>
              <Text style={s.rateUpLabel}>RATE UP</Text>
              {rateUpHeroes.map(hero => {
                // hero here is raw HEROES data (no effectiveRank field exists on
                // it — that's a per-player heroCollection concept), so this always
                // fell through to hero.rank, showing a plain pink "S" chip next to
                // a gold "SOVEREIGN" HeroCard on Sovereign banners. Match HeroCard's
                // own isSovereign check instead.
                const isSovereign = !!hero.sovereign;
                const r = isSovereign ? RANK.SOVEREIGN : RANK[hero.rank];
                return (
                  <View key={hero.id} style={[s.rateUpChip, { borderColor: r.glow + '88' }]}>
                    <View style={[s.rateUpDot, { backgroundColor: r.bg }]}>
                      <Text style={[s.rateUpRank, { color: r.text }]}>{isSovereign ? 'SOV' : hero.rank}</Text>
                    </View>
                    <Text style={s.rateUpName} numberOfLines={1}>{hero.name}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Pity info */}
          <View style={s.pityInfoRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={C.PRIMARY_LIGHT} />
            <Text style={s.pityInfoTxt}>
              Guaranteed S-rank within {event.pityLimit ?? 80} pulls
            </Text>
          </View>

          {/* 50/50 guarantee status */}
          <View style={[
            s.guaranteeRow,
            isGuaranteed
              ? { backgroundColor: C.GOLD + '18', borderColor: C.GOLD + 'AA' }
              : { backgroundColor: C.PRIMARY + '10', borderColor: C.PRIMARY_LIGHT + '44' },
          ]}>
            <Ionicons
              name={isGuaranteed ? 'star' : 'shuffle-outline'}
              size={11}
              color={isGuaranteed ? C.GOLD : C.TEXT_MUTED}
            />
            <Text style={[s.guaranteeTxt, { color: isGuaranteed ? C.GOLD : C.TEXT_MUTED }]}>
              {isGuaranteed ? 'NEXT S: GUARANTEED FEATURED' : 'NEXT S: 50/50'}
            </Text>
          </View>

          {/* Enter banner button */}
          <TouchableOpacity
            onPress={() => onEnter(event)}
            activeOpacity={0.85}
            disabled={!isActive}
            style={[s.enterBtnWrap, !isActive && { opacity: 0.4 }]}
          >
            <LinearGradient
              colors={[accent, C.SECONDARY_DARK]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.enterBtnGrad}
            >
              <Ionicons name="sparkles-outline" size={16} color={C.TEXT} />
              <Text style={s.enterBtnTxt}>ENTER BANNER</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function EventScreen({ navigation }) {
  const insets         = useSafeAreaInsets();
  const eventGuarantee = useGameStore(s => s.eventGuarantee ?? {});
  const [tab, setTab]  = useState('active');

  // Banners rotate on a fixed cadence, so these are always populated (no dead tabs).
  const activeEvents   = getActiveEvents();
  const upcomingEvents = getUpcomingEvents();
  const endedEvents    = getEndedEvents();

  const displayList = tab === 'active'   ? activeEvents
    : tab === 'upcoming' ? upcomingEvents
    : endedEvents;

  const handleEnter = (event) => {
    navigation.navigate('Summon', { openBannerId: event.id });
  };

  return (
    <View style={[s.root, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }} style={s.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color={C.TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>EVENTS</Text>
          <Text style={s.headerSub}>Limited-Time Banners</Text>
        </View>
        {activeEvents.length > 0 && (
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveChipTxt}>{activeEvents.length} LIVE</Text>
          </View>
        )}
      </LinearGradient>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {[['active', 'ACTIVE'], ['upcoming', 'UPCOMING'], ['ended', 'ENDED']].map(([key, label]) => {
          const active = tab === key;
          return (
            <TouchableOpacity key={key} style={[s.tabBtn, active && s.tabBtnActive]} onPress={() => { AudioManager.playButtonSFX(); setTab(key); }} activeOpacity={0.75}>
              <Text style={[s.tabTxt, active && s.tabTxtActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Event list */}
      {displayList.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="calendar-outline" size={48} color={C.TEXT_DISABLED} />
          <Text style={s.emptyTxt}>
            {tab === 'active' ? 'No active events right now' : tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayList.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEnter={handleEnter}
              isGuaranteed={!!eventGuarantee[event.id]}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.GLASS_7,
  },
  backBtn:     { padding: 4, marginRight: 6 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: C.TEXT, letterSpacing: 3 },
  headerSub:   { fontSize: 10, color: C.TEXT_ON_DARK_SOFT, marginTop: 1 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.SUCCESS + '22', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.SUCCESS + '55',
  },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: C.SUCCESS },
  liveChipTxt:  { fontSize: 10, fontWeight: '800', color: C.SUCCESS, letterSpacing: 1 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
    backgroundColor: C.BG_BASE,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.PRIMARY_LIGHT },
  tabTxt:       { fontSize: 10, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1 },
  tabTxtActive: { color: C.PRIMARY_LIGHT },

  scrollContent: { padding: 12, gap: 14 },

  // Card
  card: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, backgroundColor: C.BG_BASE,
    position: 'relative',
  },
  cardGlowBorder: { borderRadius: 12, borderWidth: 1.5 },
  cardInner:  { flexDirection: 'row' },
  cardHeroCol: {},
  cardInfoCol: {
    flex: 1, padding: 12, gap: 8,
    borderLeftWidth: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4 },
  activeTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  cardName:     { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  cardSubtitle: { fontSize: 10, color: C.TEXT_MUTED, fontWeight: '600', marginTop: 2 },

  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  countdownLabel: { fontSize: 9, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1.5 },
  countdownValue: { fontSize: 13, fontWeight: '900', color: C.TEXT_SOFT, letterSpacing: 1, marginLeft: 2 },

  rateUpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rateUpLabel: { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 1.5, marginRight: 2 },
  rateUpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: C.GLASS_3,
  },
  rateUpDot:  { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  rateUpRank: { fontSize: 8, fontWeight: '900' },
  rateUpName: { fontSize: 9, fontWeight: '700', color: C.TEXT, maxWidth: 100 },

  pityInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pityInfoTxt: { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600' },

  guaranteeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 5, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  guaranteeTxt: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  enterBtnWrap: { borderRadius: 8, overflow: 'hidden', marginTop: 4 },
  enterBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
  },
  enterBtnTxt: { fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 2 },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80,
  },
  emptyTxt: { fontSize: 13, color: C.TEXT_MUTED, textAlign: 'center' },
});
