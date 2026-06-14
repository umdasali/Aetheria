import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../store/gameStore';
import {
  DUNGEON_DEFS, DAILY_DUNGEON_ATTEMPTS, DUNGEON_REFILL_COST, DUNGEON_REFILL_AMOUNT,
  getDungeonEnemyGroup, getDungeonReward, getDiffColor,
} from '../data/resourceDungeons';
import { getAscensionItemById } from '../data/ascensionItems';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const { width: W } = Dimensions.get('window');
const GOLD_IMG = require('../../assets/currency/gold.png');
const GEM_IMG  = require('../../assets/currency/gem.png');

const HEADER_H = 52;
const PAD      = 12;
const GAP      = 10;

// ── Single tier row inside a dungeon panel ──────────────────────────────────
function TierRow({ dungeon, tier, onEnter }) {
  const reward   = tier.reward;
  const material = reward.material ? getAscensionItemById(reward.material.itemId) : null;
  const diffCol  = getDiffColor(tier.diff);

  return (
    <View style={[t.row, { borderColor: dungeon.accent + '30' }]}>
      {/* Tier numeral */}
      <View style={[t.tierBadge, { borderColor: diffCol + '66', backgroundColor: diffCol + '18' }]}>
        <Text style={[t.tierNum, { color: diffCol }]}>{tier.label}</Text>
      </View>

      {/* Reward */}
      <View style={t.rewardCol}>
        <View style={t.rewardLine}>
          {material
            ? <Image source={material.image} style={t.rewardIcon} resizeMode="contain" />
            : <Image source={GOLD_IMG} style={t.rewardIcon} resizeMode="contain" />}
          <Text style={t.rewardAmt} numberOfLines={1}>
            {material
              ? `${material.name} ×${reward.material.qty}`
              : `+${reward.gold.toLocaleString()}`}
          </Text>
        </View>
        {material && reward.gold > 0 && (
          <Text style={t.rewardSub}>+{reward.gold.toLocaleString()} Gold</Text>
        )}
        <Text style={[t.diffTxt, { color: diffCol }]}>{tier.diff}</Text>
      </View>

      {/* Enter */}
      <TouchableOpacity style={t.enterBtn} onPress={() => onEnter(dungeon, tier)} activeOpacity={0.85}>
        <LinearGradient
          colors={[dungeon.accent + 'AA', dungeon.accent]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={t.enterInner}
        >
          <Ionicons name="flash" size={12} color="#fff" />
          <Text style={t.enterTxt}>ENTER</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const t = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: GAP,
    borderRadius: 10, borderWidth: 1, backgroundColor: C.OVERLAY_2,
    paddingVertical: 8, paddingHorizontal: 10,
  },
  tierBadge: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tierNum:   { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  rewardCol:  { flex: 1, gap: 1 },
  rewardLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardIcon: { width: 18, height: 18 },
  rewardAmt:  { flex: 1, fontSize: 12, fontWeight: '900', color: C.TEXT },
  rewardSub:  { fontSize: 8, color: C.GOLD, fontWeight: '700' },
  diffTxt:    { fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  enterBtn:   { borderRadius: 8, overflow: 'hidden' },
  enterInner: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  enterTxt:   { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1 },
});

// ── Dungeon panel ───────────────────────────────────────────────────────────
function DungeonPanel({ dungeon, onEnter }) {
  return (
    <View style={[p.panel, { borderColor: dungeon.accent + '40' }]}>
      <LinearGradient colors={[dungeon.accent + '14', C.BG_CARD, C.BG_CARD]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />

      {/* Panel header */}
      <View style={p.head}>
        <View style={[p.iconWrap, { borderColor: dungeon.accent + '55', backgroundColor: dungeon.accent + '18' }]}>
          <Ionicons name={dungeon.icon} size={20} color={dungeon.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[p.name, { color: dungeon.accent }]} numberOfLines={1}>{dungeon.name}</Text>
          <Text style={p.sub} numberOfLines={1}>{dungeon.subtitle}</Text>
        </View>
      </View>

      {/* Tier list */}
      <View style={p.tiers}>
        {dungeon.tiers.map(tier => (
          <TierRow key={tier.tier} dungeon={dungeon} tier={tier} onEnter={onEnter} />
        ))}
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  panel: {
    flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5,
    backgroundColor: C.BG_CARD, padding: 12, gap: 10,
  },
  head:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  name:    { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  sub:     { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600', marginTop: 1 },
  tiers:   { gap: 8 },
});

// ─────────────────────────────────────────────────────────────────────────────
export default function ResourceDungeonScreen({ navigation }) {
  const team                  = useGameStore(s => s.team);
  const gems                  = useGameStore(s => s.gems);
  const dungeonAttemptsUsed   = useGameStore(s => s.dungeonAttemptsUsed);
  const checkDungeonReset     = useGameStore(s => s.checkDungeonReset);
  const useDungeonAttempt     = useGameStore(s => s.useDungeonAttempt);
  const refillDungeonAttempts = useGameStore(s => s.refillDungeonAttempts);

  const [, tick] = useState(0);
  useFocusEffect(useCallback(() => { checkDungeonReset(); tick(n => n + 1); }, [checkDungeonReset]));

  const attemptsLeft = Math.max(0, DAILY_DUNGEON_ATTEMPTS - (dungeonAttemptsUsed || 0));

  const handleEnter = (dungeon, tier) => {
    if (!team || team.length === 0) {
      Alert.alert('No Team Selected', 'Add heroes to your team before entering a dungeon.', [{ text: 'OK' }]);
      return;
    }
    if (!useDungeonAttempt()) {
      Alert.alert(
        'Out of Attempts',
        `You've used all ${DAILY_DUNGEON_ATTEMPTS} daily runs. Refill ${DUNGEON_REFILL_AMOUNT} for ${DUNGEON_REFILL_COST} gems, or come back tomorrow.`,
        [{ text: 'OK' }],
      );
      return;
    }
    AudioManager.playButtonSFX();
    navigation.navigate('Battle', {
      chapterEnemies: getDungeonEnemyGroup(dungeon.id, tier.tier),
      chapterId:      null,
      chapterRewards: { gems: 0, heroId: null },
      fromStory:      false,
      practiceMode:   false,
      dungeonMode:    true,
      dungeonId:      dungeon.id,
      dungeonTier:    tier.tier,
      dungeonRewards: getDungeonReward(dungeon.id, tier.tier),
    });
  };

  const handleRefill = () => {
    AudioManager.playButtonSFX();
    if (refillDungeonAttempts()) {
      AudioManager.playRewardClaimSFX();
    } else {
      Alert.alert('Not Enough Gems', `Refilling costs ${DUNGEON_REFILL_COST} gems.`, [{ text: 'OK' }]);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ HEADER ══ */}
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Home'); }} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color={C.TEXT} />
          </TouchableOpacity>

          <View style={s.headerMid}>
            <Text style={s.hTitle}>RESOURCE DUNGEONS</Text>
            <Text style={s.hSub}>Daily gold & ascension materials</Text>
          </View>

          {/* Attempts pill */}
          <View style={[s.attemptPill, { borderColor: (attemptsLeft > 0 ? C.SUCCESS : C.DANGER) + '55' }]}>
            <Ionicons name="flash" size={11} color={attemptsLeft > 0 ? C.SUCCESS : C.DANGER} />
            <Text style={[s.attemptTxt, { color: attemptsLeft > 0 ? C.SUCCESS : C.DANGER }]}>
              {attemptsLeft}/{DAILY_DUNGEON_ATTEMPTS}
            </Text>
          </View>

          <TouchableOpacity style={s.refillBtn} onPress={handleRefill} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={13} color={C.PRIMARY_LIGHT} />
            <Image source={GEM_IMG} style={s.refillGem} resizeMode="contain" />
            <Text style={s.refillTxt}>{DUNGEON_REFILL_COST}</Text>
          </TouchableOpacity>
        </View>

        {/* ══ BODY ══ */}
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.body}
        >
          <View style={s.panelRow}>
            {DUNGEON_DEFS.map(d => (
              <DungeonPanel key={d.id} dungeon={d} onEnter={handleEnter} />
            ))}
          </View>

          <View style={s.note}>
            <Ionicons name="information-circle-outline" size={12} color={C.TEXT_MUTED} />
            <Text style={s.noteTxt}>
              {DAILY_DUNGEON_ATTEMPTS} free runs daily (shared across dungeons). Higher tiers field tougher foes for bigger rewards.
            </Text>
          </View>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    height: HEADER_H, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  back: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.GLASS_6,
  },
  headerMid: { flex: 1 },
  hTitle:    { fontSize: 14, fontWeight: '900', color: C.TEXT, letterSpacing: 2.5 },
  hSub:      { fontSize: 8, color: C.TEXT_ON_DARK_MUTED, marginTop: 1 },

  attemptPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, backgroundColor: C.OVERLAY_2,
  },
  attemptTxt: { fontSize: 12, fontWeight: '900' },

  refillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '55', backgroundColor: C.PRIMARY_GLOW,
  },
  refillGem: { width: 13, height: 13 },
  refillTxt: { fontSize: 11, fontWeight: '900', color: C.PRIMARY_LIGHT },

  body:     { padding: PAD, gap: GAP },
  panelRow: { flexDirection: 'row', gap: GAP },

  note:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  noteTxt: { flex: 1, fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600', lineHeight: 13 },
});
