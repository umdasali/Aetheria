import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { ACHIEVEMENT_DEFS, ACHIEVEMENT_CATEGORIES } from '../data/achievements';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const { width: W } = Dimensions.get('window');

const CAT_ICONS = {
  battle:     'trophy-outline',
  collection: 'people-outline',
  story:      'book-outline',
  tower:      'layers-outline',
  milestone:  'ribbon-outline',
};

const CAT_LABELS = {
  battle:     'BATTLE',
  collection: 'COLLECT',
  story:      'STORY',
  tower:      'TOWER',
  milestone:  'MILESTONE',
};

export default function AchievementScreen({ navigation }) {
  const achievements           = useGameStore(s => s.achievements);
  const claimAchievementReward = useGameStore(s => s.claimAchievementReward);

  const [activeCategory, setActiveCategory] = useState('battle');

  const categoryDefs = useMemo(
    () => ACHIEVEMENT_DEFS.filter(d => d.category === activeCategory),
    [activeCategory],
  );

  // Derive counts directly from achievements store - never stale after claiming
  const totalUnlocked = useMemo(
    () => ACHIEVEMENT_DEFS.filter(d => (achievements[d.id]?.progress ?? 0) >= d.target).length,
    [achievements],
  );

  const claimableCount = useMemo(
    () => ACHIEVEMENT_DEFS.filter(d => {
      const a = achievements[d.id];
      return (a?.progress ?? 0) >= d.target && !a?.claimed;
    }).length,
    [achievements],
  );

  const renderAchievementRow = (def) => {
    const data       = achievements[def.id] || {};
    const progress   = data.progress ?? 0;
    const isUnlocked = progress >= def.target;
    const isClaimed  = data.claimed;
    const canClaim   = isUnlocked && !isClaimed;
    const pct        = Math.min(progress / def.target, 1);
    const isPending  = isUnlocked && !isClaimed;

    return (
      <View key={def.id} style={[s.achRow, isUnlocked && !isClaimed && s.achRowReady]}>
        {/* Icon */}
        <View style={[s.achIcon, isUnlocked && s.achIconUnlocked]}>
          <Ionicons
            name={def.icon}
            size={20}
            color={isUnlocked ? C.PRIMARY_LIGHT : C.TEXT_DISABLED}
          />
          {isPending && <View style={s.newDot} />}
        </View>

        {/* Text + progress */}
        <View style={s.achInfo}>
          <View style={s.achTitleRow}>
            <Text style={[s.achTitle, isUnlocked && s.achTitleUnlocked]}>
              {def.title}
            </Text>
            {isUnlocked && !isClaimed && (
              <View style={s.readyBadge}>
                <Text style={s.readyBadgeTxt}>READY</Text>
              </View>
            )}
            {isClaimed && (
              <Ionicons name="checkmark-circle" size={14} color={C.SUCCESS} />
            )}
          </View>
          <Text style={s.achDesc}>{def.desc}</Text>

          {/* Progress bar */}
          {!isUnlocked && (
            <View style={s.progressWrap}>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${pct * 100}%` }]} />
              </View>
              <Text style={s.progressTxt}>{progress} / {def.target}</Text>
            </View>
          )}
        </View>

        {/* Reward + claim */}
        <View style={s.achRight}>
          {def.reward.gems > 0 && (
            <View style={s.rewardRow}>
              <Ionicons name="diamond-outline" size={11} color={C.PRIMARY_LIGHT} />
              <Text style={s.rewardTxt}>+{def.reward.gems}</Text>
            </View>
          )}
          {def.reward.gold > 0 && (
            <View style={s.rewardRow}>
              <Ionicons name="cash-outline" size={11} color={C.GOLD} />
              <Text style={[s.rewardTxt, { color: C.GOLD }]}>+{def.reward.gold}</Text>
            </View>
          )}
          {canClaim && (
            <TouchableOpacity
              style={s.claimBtn}
              onPress={() => { AudioManager.playRewardClaimSFX(); claimAchievementReward(def.id); }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={C.GRAD_PINK}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.claimBtnGrad}
              >
                <Text style={s.claimBtnTxt}>CLAIM</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={[s.header, { paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }} style={s.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color={C.TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>ACHIEVEMENTS</Text>
          <Text style={s.headerSub}>{totalUnlocked} / {ACHIEVEMENT_DEFS.length} unlocked</Text>
        </View>
        {/* Claimable indicator */}
        {claimableCount > 0 && (
          <View style={s.pendingChip}>
            <Text style={s.pendingChipTxt}>{claimableCount} READY</Text>
          </View>
        )}
      </LinearGradient>

      {/* Body: sidebar + list */}
      <View style={s.body}>
        {/* Category sidebar */}
        <View style={s.sidebar}>
          <LinearGradient colors={[C.BG_BASE, C.BG_MID]} style={StyleSheet.absoluteFill} />
          {ACHIEVEMENT_CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            const defs = ACHIEVEMENT_DEFS.filter(d => d.category === cat);
            const unlocked = defs.filter(d => (achievements[d.id]?.progress ?? 0) >= d.target).length;
            const hasPending = defs.some(d => {
              const a = achievements[d.id];
              return (a?.progress ?? 0) >= d.target && !a?.claimed;
            });
            return (
              <TouchableOpacity
                key={cat}
                style={[s.catBtn, active && s.catBtnActive]}
                onPress={() => { AudioManager.playButtonSFX(); setActiveCategory(cat); }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={CAT_ICONS[cat]}
                  size={18}
                  color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED}
                />
                <Text style={[s.catTxt, active && s.catTxtActive]}>{CAT_LABELS[cat]}</Text>
                <Text style={s.catProgress}>{unlocked}/{defs.length}</Text>
                {hasPending && <View style={s.catDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Achievement list */}
        <FlatList
          data={categoryDefs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderAchievementRow(item)}
          style={s.listWrap}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const SIDEBAR_W = 88;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.GLASS_7,
  },
  backBtn:      { padding: 4, marginRight: 6 },
  headerTitle:  { fontSize: 16, fontWeight: '900', color: C.TEXT, letterSpacing: 3 },
  headerSub:    { fontSize: 10, color: C.TEXT_ON_DARK_SOFT, marginTop: 1 },
  pendingChip: {
    backgroundColor: C.SECONDARY + '22', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.SECONDARY + '66',
  },
  pendingChipTxt: { fontSize: 10, fontWeight: '800', color: C.SECONDARY_LIGHT, letterSpacing: 1 },

  body:    { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: SIDEBAR_W, overflow: 'hidden',
    borderRightWidth: 1, borderRightColor: C.BORDER_SUBTLE,
    flexDirection: 'column',
  },

  catBtn: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center', gap: 3,
    position: 'relative',
    borderRightWidth: 2, borderRightColor: 'transparent',
  },
  catBtnActive: {
    backgroundColor: C.PRIMARY + '12',
    borderRightColor: C.PRIMARY_LIGHT,
  },
  catTxt:      { fontSize: 7, color: C.TEXT_MUTED, fontWeight: '800', letterSpacing: 0.5 },
  catTxtActive:{ color: C.PRIMARY_LIGHT },
  catProgress: { fontSize: 7, color: C.TEXT_DISABLED, fontWeight: '600' },
  catDot: {
    position: 'absolute', top: 8, right: 10,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.SECONDARY,
  },

  listWrap:    { flex: 1 },
  listContent: { paddingVertical: 6, paddingHorizontal: 10, gap: 6 },

  achRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 10,
    backgroundColor: C.BG_BASE,
    borderWidth: 1, borderColor: C.BORDER_SUBTLE,
  },
  achRowReady: {
    borderColor: C.PRIMARY_LIGHT + '44',
    backgroundColor: C.PRIMARY + '0A',
  },

  achIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.BORDER,
    position: 'relative',
  },
  achIconUnlocked: {
    backgroundColor: C.PRIMARY + '1A',
    borderColor: C.PRIMARY_LIGHT + '44',
  },
  newDot: {
    position: 'absolute', top: 3, right: 3,
    width: 7, height: 7, borderRadius: 4, backgroundColor: C.SECONDARY,
  },

  achInfo:     { flex: 1, gap: 4 },
  achTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  achTitle:    { fontSize: 12, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.5 },
  achTitleUnlocked: { color: C.TEXT },
  achDesc:     { fontSize: 10, color: C.TEXT_DISABLED, lineHeight: 14 },
  readyBadge: {
    backgroundColor: C.PRIMARY + '22', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '66',
  },
  readyBadgeTxt: { fontSize: 7, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 1 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  progressBg:   { flex: 1, height: 4, backgroundColor: C.GLASS_5, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.PRIMARY, borderRadius: 2 },
  progressTxt:  { fontSize: 8, color: C.TEXT_MUTED, fontWeight: '600', width: 50 },

  achRight: { alignItems: 'flex-end', gap: 4, minWidth: 70 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rewardTxt: { fontSize: 10, fontWeight: '700', color: C.PRIMARY_LIGHT },

  claimBtn:     { borderRadius: 6, overflow: 'hidden', marginTop: 2 },
  claimBtnGrad: { paddingHorizontal: 12, paddingVertical: 6 },
  claimBtnTxt:  { fontSize: 10, fontWeight: '900', color: C.TEXT, letterSpacing: 1 },
});
