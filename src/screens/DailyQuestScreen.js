import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { QUEST_DEFS, TOTAL_DAILY_GEMS, TOTAL_DAILY_GOLD } from '../data/dailyQuests';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');

// ── Countdown until midnight (next reset) ─────────────────────────────────────
function calcCountdown() {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight - now;
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const s = Math.floor((diffMs % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useResetCountdown() {
  const [display, setDisplay] = useState(calcCountdown);
  useEffect(() => {
    const t = setInterval(() => setDisplay(calcCountdown()), 1000);
    return () => clearInterval(t);
  }, []);
  return display;
}

export default function DailyQuestScreen({ navigation }) {
  const getDailyQuestProgress = useGameStore(s => s.getDailyQuestProgress);
  const claimQuestReward      = useGameStore(s => s.claimQuestReward);
  const { progress, claimed } = getDailyQuestProgress();
  const resetIn = useResetCountdown();

  const totalClaimed  = QUEST_DEFS.filter(q => claimed[q.id]).length;
  const allDone       = totalClaimed === QUEST_DEFS.length;

  const gemsEarned = useMemo(
    () => QUEST_DEFS.filter(q => claimed[q.id]).reduce((s, q) => s + q.reward.gems, 0),
    [claimed],
  );
  const goldEarned = useMemo(
    () => QUEST_DEFS.filter(q => claimed[q.id]).reduce((s, q) => s + q.reward.gold, 0),
    [claimed],
  );

  const handleClaim = (quest) => {
    AudioManager.playButtonSFX();
    claimQuestReward(quest.id, quest.reward.gems, quest.reward.gold);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ── Header ── */}
        <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
          <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>DAILY QUESTS</Text>
            <Text style={s.headerSub}>{totalClaimed} / {QUEST_DEFS.length} completed  ·  Resets in {resetIn}</Text>
          </View>
          {allDone && (
            <View style={s.allDoneBadge}>
              <Ionicons name="checkmark-done" size={12} color={C.SUCCESS} />
              <Text style={s.allDoneText}>ALL DONE!</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Progress summary bar ── */}
        <View style={s.summaryBar}>
          <View style={s.summaryTrack}>
            <LinearGradient
              colors={[C.PRIMARY_DARK, allDone ? C.SUCCESS : C.PRIMARY]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.summaryFill, { width: `${(totalClaimed / QUEST_DEFS.length) * 100}%` }]}
            />
          </View>
          <Text style={s.summaryPct}>{Math.round((totalClaimed / QUEST_DEFS.length) * 100)}%</Text>
        </View>

        {/* ── Quest list ── */}
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>

          {QUEST_DEFS.map((quest) => {
            const prog      = Math.min(progress[quest.id] || 0, quest.target);
            const complete  = prog >= quest.target;
            const isClaimed = claimed[quest.id];
            const pct       = complete ? 1 : prog / quest.target;

            const accentColor = isClaimed ? C.SUCCESS
              : complete      ? C.GOLD
              :                 C.PRIMARY_LIGHT;

            return (
              <View key={quest.id} style={[s.card, isClaimed && s.cardClaimed]}>
                <LinearGradient
                  colors={isClaimed
                    ? [C.SUCCESS + '14', C.BG_BASE]
                    : complete
                    ? [C.GOLD + '12', C.BG_BASE]
                    : [C.BG_MID, C.BG_BASE]}
                  style={StyleSheet.absoluteFill}
                />

                {/* Left icon */}
                <View style={[s.iconWrap, { backgroundColor: accentColor + '20', borderColor: accentColor + '55' }]}>
                  {isClaimed
                    ? <Ionicons name="checkmark-done" size={20} color={C.SUCCESS} />
                    : <Ionicons name={quest.icon} size={20} color={accentColor} />}
                </View>

                {/* Middle — title + progress */}
                <View style={s.middle}>
                  <Text style={[s.questTitle, isClaimed && { color: C.TEXT_MUTED }]}>
                    {quest.title}
                  </Text>
                  <Text style={s.questDesc}>{quest.desc}</Text>

                  {/* Progress bar */}
                  <View style={s.progTrack}>
                    <View style={[s.progFill, {
                      width: `${pct * 100}%`,
                      backgroundColor: isClaimed ? C.SUCCESS : complete ? C.GOLD : C.PRIMARY,
                    }]} />
                  </View>
                  <Text style={[s.progLabel, { color: accentColor }]}>
                    {prog} / {quest.target}
                  </Text>
                </View>

                {/* Right — reward + claim */}
                <View style={s.right}>
                  {/* Reward chips */}
                  <View style={s.rewardRow}>
                    {quest.reward.gems > 0 && (
                      <View style={s.rewardChip}>
                        <Image source={GEM_IMG} style={s.rewardIcon} resizeMode="contain" />
                        <Text style={[s.rewardAmt, { color: C.PRIMARY_LIGHT }]}>+{quest.reward.gems}</Text>
                      </View>
                    )}
                    {quest.reward.gold > 0 && (
                      <View style={s.rewardChip}>
                        <Image source={GOLD_IMG} style={s.rewardIcon} resizeMode="contain" />
                        <Text style={[s.rewardAmt, { color: C.GOLD }]}>+{quest.reward.gold}</Text>
                      </View>
                    )}
                  </View>

                  {/* Claim button */}
                  {isClaimed ? (
                    <View style={s.claimedBadge}>
                      <Text style={s.claimedText}>CLAIMED</Text>
                    </View>
                  ) : complete ? (
                    <TouchableOpacity
                      style={s.claimBtn}
                      onPress={() => handleClaim(quest)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={C.GRAD_GOLD}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.claimBtnInner}
                      >
                        <Text style={s.claimBtnText}>CLAIM</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={s.pendingBadge}>
                      <Text style={s.pendingText}>IN PROGRESS</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* ── Total earned today ── */}
          <View style={s.totalCard}>
            <LinearGradient colors={[C.PRIMARY_DARK + '30', C.BG_BASE]} style={StyleSheet.absoluteFill} />
            <Text style={s.totalLabel}>TODAY'S EARNINGS</Text>
            <View style={s.totalRow}>
              <View style={s.totalItem}>
                <Image source={GEM_IMG} style={s.totalIcon} resizeMode="contain" />
                <Text style={[s.totalAmt, { color: C.PRIMARY_LIGHT }]}>{gemsEarned}</Text>
                <Text style={s.totalMax}>/ {TOTAL_DAILY_GEMS} gems</Text>
              </View>
              <View style={[s.totalItem, { borderLeftWidth: 1, borderLeftColor: C.BORDER, paddingLeft: 12 }]}>
                <Image source={GOLD_IMG} style={s.totalIcon} resizeMode="contain" />
                <Text style={[s.totalAmt, { color: C.GOLD }]}>{goldEarned}</Text>
                <Text style={s.totalMax}>/ {TOTAL_DAILY_GOLD} gold</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, gap: 10,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  allDoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.SUCCESS + '22', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.SUCCESS + '55',
  },
  allDoneText: { fontSize: 10, fontWeight: '900', color: C.SUCCESS, letterSpacing: 1 },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 10,
  },
  summaryTrack: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: C.BG_MID, overflow: 'hidden',
  },
  summaryFill: { height: 5, borderRadius: 3 },
  summaryPct:  { fontSize: 10, fontWeight: '900', color: C.TEXT_MUTED, width: 36, textAlign: 'right' },

  list: { padding: 12, gap: 10, paddingBottom: 24 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, overflow: 'hidden', borderWidth: 1,
    borderColor: C.BORDER, padding: 12, position: 'relative',
  },
  cardClaimed: { borderColor: C.SUCCESS + '40', opacity: 0.8 },

  iconWrap: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  middle: { flex: 1, gap: 3 },
  questTitle: { fontSize: 13, fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  questDesc:  { fontSize: 10, color: C.TEXT_MUTED, lineHeight: 14, marginBottom: 4 },

  progTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: C.BG_MID, overflow: 'hidden',
  },
  progFill:  { height: 4, borderRadius: 2 },
  progLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },

  right: { alignItems: 'flex-end', gap: 6, minWidth: 90 },

  rewardRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  rewardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.BG_MID, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.BORDER,
  },
  rewardAmt:  { fontSize: 10, fontWeight: '800' },
  rewardIcon: { width: 14, height: 14 },
  totalIcon:  { width: 20, height: 20 },

  claimBtn:      { borderRadius: 8, overflow: 'hidden' },
  claimBtnInner: { paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center' },
  claimBtnText:  { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  claimedBadge: {
    backgroundColor: C.SUCCESS + '18', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.SUCCESS + '40',
  },
  claimedText: { fontSize: 9, fontWeight: '900', color: C.SUCCESS, letterSpacing: 1 },

  pendingBadge: {
    backgroundColor: C.BG_MID, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.BORDER,
  },
  pendingText: { fontSize: 9, fontWeight: '700', color: C.TEXT_DISABLED, letterSpacing: 0.5 },

  totalCard: {
    borderRadius: 12, overflow: 'hidden', borderWidth: 1,
    borderColor: C.BORDER_STRONG, padding: 14, position: 'relative',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 9, fontWeight: '900', color: C.TEXT_MUTED,
    letterSpacing: 2.5, marginBottom: 10,
  },
  totalRow:  { flexDirection: 'row', gap: 12 },
  totalItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalAmt:  { fontSize: 20, fontWeight: '900' },
  totalMax:  { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600' },
});
