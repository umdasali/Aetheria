import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions, Animated, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import HeroCard from '../components/HeroCard';
import FactionParticles from '../components/FactionParticles';
import ForgeViz from '../components/ui/ForgeViz';
import { HEROES, FACTIONS } from '../data/heroes';
import useGameStore, { FUSION_COPIES, TRANSCEND_COPIES } from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import {
  ASCENSION_STAT_MULT, ASCENSION_MAX,
  RANK_TO_ASCENSION_ITEM_ID, getAscensionItemById,
} from '../data/ascensionItems';
import { RANK_STAT_MULT } from '../utils/battleEngine';
import { C, RANK, RANK_COLORS } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const BODY_PAD  = 12;
const RANK_ORDER = ['C', 'B', 'A', 'S'];

// Absolute stat ceilings across all heroes — bars differ per hero
const STAT_ABS_MAX = { HP: 25000, ATK: 3000, DEF: 2500, CRIT: 2500 };

// Tower coins earned per copy by rank
const COINS_PER_COPY = { SOVEREIGN: 200, S: 80, A: 35, B: 15, C: 8 };

// ── Glass panel helper ────────────────────────────────────────────────────────
function Glass({ style, children, borderColor }) {
  return (
    <View style={[glass.wrap, style, borderColor ? { borderColor } : null]}>
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Dark backing (was a faint white tint) so card text stays legible over the
          bright blurred hero portrait behind the body. */}
      <LinearGradient colors={[C.OVERLAY_3, C.OVERLAY_4]} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
const glass = StyleSheet.create({
  wrap: {
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER,
    position: 'relative',
  },
});

// ── Chip button ───────────────────────────────────────────────────────────────
function Chip({ icon, label, color, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.75}
      style={[chip.wrap, { borderColor: color + '55', backgroundColor: color + '15', opacity: disabled ? 0.45 : 1 }]}
    >
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[chip.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
});

// ── Pixel-accurate progress bar ───────────────────────────────────────────────
// Uses onLayout → animates an Animated.Value to pixel width (not %).
// This guarantees bars actually end at different positions.
function StatBar({ value, max, color }) {
  const [trackW, setTrackW] = useState(0);
  const fillAnim = useRef(new Animated.Value(0)).current;

  const onLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    setTrackW(w);
  }, []);

  useEffect(() => {
    if (trackW === 0) return;
    const target = Math.round(Math.min(value / max, 1) * trackW);
    Animated.timing(fillAnim, {
      toValue: target,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [trackW, value, max]);

  return (
    <View
      onLayout={onLayout}
      style={[sb.track, { backgroundColor: color + '18' }]}
    >
      <Animated.View
        style={[sb.fill, { width: fillAnim, backgroundColor: color }]}
      />
      {/* Leading glow nub */}
      {trackW > 0 && (
        <Animated.View
          style={[sb.nub, {
            backgroundColor: color,
            shadowColor: color,
            left: Animated.subtract(fillAnim, 3),
          }]}
        />
      )}
    </View>
  );
}
const sb = StyleSheet.create({
  track: { height: 5, borderRadius: 3, overflow: 'visible', position: 'relative' },
  fill:  { height: '100%', borderRadius: 3, position: 'absolute', left: 0, top: 0 },
  nub:   {
    position: 'absolute', top: -2, width: 6, height: 9, borderRadius: 3,
    shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
});

// ── Section heading ───────────────────────────────────────────────────────────
function SHead({ label }) {
  return <Text style={shared.sHead}>{label}</Text>;
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile', label: 'PROFILE', icon: 'person-outline' },
  { key: 'skills',  label: 'SKILLS',  icon: 'flash-outline' },
  { key: 'level',   label: 'LEVEL',   icon: 'trending-up-outline' },
  { key: 'forge',   label: 'FORGE',   icon: 'git-merge-outline' },
];

function TabBar({ active, onChange, accent }) {
  return (
    <View style={tb.row}>
      {TABS.map(t => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={tb.tab} onPress={() => onChange(t.key)} activeOpacity={0.7}>
            <Ionicons name={t.icon} size={12} color={on ? accent : C.TEXT_DISABLED} />
            <Text style={[tb.label, { color: on ? accent : C.TEXT_DISABLED }]}>{t.label}</Text>
            {on && <View style={[tb.bar, { backgroundColor: accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const tb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: C.BG_STATS,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.BORDER_SUBTLE,
    marginBottom: 8,
  },
  tab:   { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 2 },
  label: { fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  bar:   { height: 2, width: '50%', borderRadius: 1, marginTop: 2 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONTENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Profile ────────────────────────────────────────────────────────────────
function ProfileTab({
  hero, faction, owned, inTeam, teamFull, addToTeam,
  level, maxLevel, transcendence, ascension, ascMult, ascItemColor,
  effectiveHp, effectiveAtk, effectiveDef, effectiveCrit,
  saving, saved, handleDownload,
}) {
  const accent = faction.color;

  return (
    <View style={styles.tabContent}>
      {/* About glass card */}
      <Glass style={styles.aboutCard}>
        <Text style={styles.aboutTxt} numberOfLines={2}>{hero.about}</Text>
      </Glass>

      {/* 2×2 stat grid */}
      <View style={styles.statGrid}>
        {[
          { key: 'HP',   val: effectiveHp,   color: accent },
          { key: 'ATK',  val: effectiveAtk,  color: accent },
          { key: 'DEF',  val: effectiveDef,  color: accent },
          { key: 'CRIT', val: effectiveCrit, color: accent },
        ].map(({ key, val, color }) => (
          <Glass key={key} style={styles.statCell}>
            <Text style={[styles.statVal, { color }]}>{val.toLocaleString()}</Text>
            <Text style={styles.statKey}>{key}</Text>
            <View style={styles.statBarWrap}>
              <StatBar value={val} max={STAT_ABS_MAX[key]} color={color} />
            </View>
          </Glass>
        ))}
      </View>

      {/* Level + ascension info row */}
      <View style={styles.infoRow}>
        <Glass style={styles.infoPill}>
          <Text style={[styles.infoPillTxt, { color: accent }]}>Lv.{level}/{maxLevel}</Text>
          {transcendence > 0 && <Text style={[styles.infoPillSub, { color: C.GOLD }]}>✦{transcendence}</Text>}
        </Glass>
        {ascension > 0 && (
          <Glass style={styles.infoPill}>
            <Text style={[styles.infoPillTxt, { color: ascItemColor }]}>
              ★{ascension}  +{Math.round((ascMult - 1) * 100)}%
            </Text>
          </Glass>
        )}
        {hero.element && (
          <Glass style={styles.infoPill}>
            <Text style={[styles.infoPillTxt, { color: C.CYAN }]}>{hero.element}</Text>
          </Glass>
        )}
      </View>

      {/* Action chips */}
      <View style={styles.chipRow}>
        {owned ? (
          <>
            <Chip
              icon={inTeam ? 'remove-circle-outline' : teamFull ? 'people-outline' : 'add-circle-outline'}
              label={inTeam ? 'REMOVE' : teamFull ? 'TEAM FULL' : 'ADD TO TEAM'}
              color={inTeam ? C.DANGER : teamFull ? C.TEXT_MUTED : accent}
              onPress={teamFull ? undefined : () => addToTeam(hero.id)}
              disabled={teamFull}
            />
            <Chip
              icon={saved ? 'checkmark-done-outline' : saving ? 'hourglass-outline' : 'share-social-outline'}
              label={saved ? 'SHARED!' : saving ? 'SHARING…' : 'SHARE'}
              color={saved ? C.SUCCESS : C.TEXT_MUTED}
              onPress={handleDownload}
              disabled={saving}
            />
          </>
        ) : (
          <Chip icon="lock-closed-outline" label="UNLOCK VIA SUMMON" color={C.GOLD} disabled />
        )}
      </View>
    </View>
  );
}

// ── 2. Skills ─────────────────────────────────────────────────────────────────
function SkillsTab({ hero, faction }) {
  const accent = faction.color;
  return (
    <View style={styles.tabContent}>
      {hero.skills.map((sk, i) => (
        <Glass key={i} style={styles.skillCard} borderColor={accent + '30'}>
          {/* Cost badge */}
          <View style={[styles.skillCostBadge, { borderColor: accent + '70', backgroundColor: accent + '18' }]}>
            <Text style={[styles.skillCostTxt, { color: accent }]}>{sk.cost}</Text>
          </View>
          {/* Body */}
          <View style={styles.skillBody}>
            <Text style={styles.skillName}>{sk.name}</Text>
            <Text style={styles.skillDesc} numberOfLines={2}>{sk.description}</Text>
          </View>
          {/* Damage */}
          {sk.damage > 0 && (
            <View style={styles.skillDmg}>
              <Text style={styles.skillDmgTxt}>{sk.damage}×</Text>
            </View>
          )}
          {sk.damage === 0 && (
            <View style={[styles.skillDmg, { backgroundColor: C.SUCCESS + '20' }]}>
              <Text style={[styles.skillDmgTxt, { color: C.SUCCESS }]}>HEAL</Text>
            </View>
          )}
        </Glass>
      ))}

      {/* Trump card */}
      <Glass style={styles.trumpCard} borderColor={accent + '55'}>
        <LinearGradient
          colors={[accent + '25', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <View style={styles.trumpLeft}>
          <Text style={styles.trumpLabel}>TRUMP CARD</Text>
          <Text style={[styles.trumpName, { color: C.GOLD }]}>{hero.trumpCard.name.toUpperCase()}</Text>
        </View>
        <Text style={[styles.trumpEffect, { color: accent }]} numberOfLines={2}>
          ✦ {hero.trumpCard.effect}
        </Text>
      </Glass>
    </View>
  );
}

// ── 3. Level ──────────────────────────────────────────────────────────────────
function LevelTab({
  hero, faction, owned, gold,
  level, maxLevel, levelCost, canLevelUp, isMaxLevel, copies,
  transcendence, canTranscend, canAffordTranscend, transcendCost,
  ascension, canAscend, requiredItem, ownedItemCount, ascItemColor,
  onLevelUp, onTranscend, onAscend,
  fusionMsg, transcendMsg, ascendMsg,
  statDiff,
}) {
  const accent = faction.color;

  // Arc ring — drawn as a thin border-radius circle with a clip-path trick:
  // We use two rotating half-covers to reveal a % of the ring.
  const pct     = level / maxLevel;
  const degrees = Math.round(pct * 360);

  return (
    <View style={styles.tabContent}>
      <View style={styles.levelLayout}>

        {/* LEFT — level ring */}
        <View style={styles.levelLeft}>
          <Glass style={styles.levelRingCard} borderColor={accent + '50'}>
            {/* Outer glow ring background */}
            <View style={[styles.ringOuter, { borderColor: accent + '25' }]}>
              {/* Filled arc using a gradient overlay trick */}
              <View style={[styles.ringFill, { borderColor: accent }]}>
                {/* Mask the unfilled portion */}
                <View
                  style={[
                    styles.ringMask,
                    {
                      backgroundColor: C.BG_STATS,
                      transform: [{ rotate: `${degrees}deg` }],
                    },
                  ]}
                />
              </View>
              {/* Center content */}
              <View style={styles.ringCenter}>
                <Text style={[styles.ringLevel, { color: accent }]}>{level}</Text>
                <Text style={styles.ringMax}>/ {maxLevel}</Text>
              </View>
            </View>

            {/* Level up button */}
            {owned && (
              <TouchableOpacity
                style={[
                  styles.lvUpBtn,
                  {
                    borderColor: isMaxLevel ? C.GOLD + '55' : canLevelUp ? accent + '80' : C.BORDER,
                    backgroundColor: isMaxLevel ? C.GOLD + '10' : canLevelUp ? accent + '15' : 'transparent',
                  },
                ]}
                onPress={canLevelUp ? onLevelUp : undefined}
                disabled={!canLevelUp}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isMaxLevel ? 'trophy-outline' : 'arrow-up-outline'}
                  size={11}
                  color={isMaxLevel ? C.GOLD : canLevelUp ? accent : C.TEXT_DISABLED}
                />
                <Text style={[styles.lvUpTxt, { color: isMaxLevel ? C.GOLD : canLevelUp ? accent : C.TEXT_DISABLED }]}>
                  {isMaxLevel ? 'MAX' : `${levelCost.toLocaleString()} G`}
                </Text>
              </TouchableOpacity>
            )}
            {!owned && (
              <Text style={styles.lockedHint}>UNLOCK TO LEVEL</Text>
            )}
          </Glass>
        </View>

        {/* RIGHT — transcend + ascend panels */}
        <View style={styles.levelRight}>
          {/* Transcendence */}
          <Glass
            style={[styles.upgradeCard, { opacity: !owned ? 0.4 : 1 }]}
            borderColor={canAffordTranscend ? C.PRIMARY + '70' : C.BORDER_SUBTLE}
          >
            <LinearGradient
              colors={canAffordTranscend ? [C.PRIMARY + '20', 'transparent'] : ['transparent', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.upgradeTop}>
              <Ionicons name="arrow-up-circle-outline" size={13} color={canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED} />
              <Text style={[styles.upgradeName, { color: canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>TRANSCEND</Text>
              <View style={[styles.upgradeBadge, { backgroundColor: copies >= TRANSCEND_COPIES ? C.PRIMARY + '25' : C.BG_STATS }]}>
                <Text style={[styles.upgradeBadgeTxt, { color: copies >= TRANSCEND_COPIES ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>{copies}/{TRANSCEND_COPIES}</Text>
              </View>
            </View>
            <Text style={styles.upgradeSub}>
              Max Lv {maxLevel} → {maxLevel + 5}
            </Text>
            <Text style={[styles.upgradeCost, { color: canAffordTranscend ? C.GOLD : C.TEXT_DISABLED }]}>
              {transcendCost.toLocaleString()} G
            </Text>
            {owned && canTranscend && (
              <TouchableOpacity
                style={[styles.upgradeBtn, {
                  borderColor: canAffordTranscend ? C.PRIMARY : C.BORDER,
                  backgroundColor: canAffordTranscend ? C.PRIMARY + '20' : 'transparent',
                }]}
                onPress={canAffordTranscend ? onTranscend : undefined}
                disabled={!canAffordTranscend}
                activeOpacity={0.75}
              >
                <Text style={[styles.upgradeBtnTxt, { color: canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>
                  {canAffordTranscend ? 'TRANSCEND' : 'NEED GOLD'}
                </Text>
              </TouchableOpacity>
            )}
            {(!owned || !canTranscend) && (
              <Text style={styles.upgradeHint}>
                {!owned ? 'Unlock first' : transcendence >= 4 ? 'MAX REACHED' : `${copies}/${TRANSCEND_COPIES} copies`}
              </Text>
            )}
            {transcendMsg !== '' && <Text style={[styles.upgradeErr, { color: C.PRIMARY_LIGHT }]}>{transcendMsg}</Text>}
          </Glass>

          {/* Ascension */}
          <Glass
            style={[styles.upgradeCard, { opacity: !owned ? 0.4 : 1 }]}
            borderColor={canAscend ? ascItemColor + '70' : C.BORDER_SUBTLE}
          >
            <LinearGradient
              colors={canAscend ? [ascItemColor + '20', 'transparent'] : ['transparent', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.upgradeTop}>
              <Ionicons name="sparkles-outline" size={13} color={canAscend ? ascItemColor : C.TEXT_DISABLED} />
              <Text style={[styles.upgradeName, { color: canAscend ? ascItemColor : C.TEXT_DISABLED }]}>ASCEND</Text>
              <View style={styles.ascTierRow}>
                {[1, 2, 3].map(t => (
                  <Text key={t} style={[styles.ascStar, { color: t <= ascension ? ascItemColor : C.TEXT_DISABLED }]}>★</Text>
                ))}
              </View>
            </View>
            <Text style={styles.upgradeSub}>
              {requiredItem ? requiredItem.name : 'Item required'}
            </Text>
            <Text style={[styles.upgradeCost, { color: ownedItemCount >= 1 ? ascItemColor : C.TEXT_DISABLED }]}>
              {ownedItemCount} / 1 owned
            </Text>
            {owned && ascension < ASCENSION_MAX && requiredItem && (
              <TouchableOpacity
                style={[styles.upgradeBtn, {
                  borderColor: canAscend ? ascItemColor : C.BORDER,
                  backgroundColor: canAscend ? ascItemColor + '20' : 'transparent',
                }]}
                onPress={canAscend ? onAscend : undefined}
                disabled={!canAscend}
                activeOpacity={0.75}
              >
                <Text style={[styles.upgradeBtnTxt, { color: canAscend ? ascItemColor : C.TEXT_DISABLED }]}>
                  {canAscend ? `ASCEND → TIER ${ascension + 1}` : 'NEED ITEM'}
                </Text>
              </TouchableOpacity>
            )}
            {ascension >= ASCENSION_MAX && (
              <Text style={[styles.upgradeHint, { color: C.GOLD }]}>MAX TIER</Text>
            )}
            {ascendMsg !== '' && <Text style={[styles.upgradeErr, { color: ascItemColor }]}>{ascendMsg}</Text>}
          </Glass>
        </View>
      </View>

      {/* Stat diff panel */}
      {statDiff && (
        <Glass style={[styles.diffPanel, { borderColor: statDiff.color + '55' }]}>
          <LinearGradient colors={[statDiff.color + '12', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.diffHeader}>
            <Ionicons name="trending-up" size={10} color={statDiff.color} />
            <Text style={[styles.diffLabel, { color: statDiff.color }]}>{statDiff.label}</Text>
          </View>
          {statDiff.transcendOnly ? (
            <Text style={styles.diffNote}>Level up to unlock extra potential</Text>
          ) : (
            <View style={styles.diffRow}>
              {statDiff.gains.map(({ stat, before, after, color }) => (
                <View key={stat} style={styles.diffCell}>
                  <Text style={[styles.diffStat, { color }]}>{stat}</Text>
                  <Text style={styles.diffBefore}>{before.toLocaleString()}</Text>
                  <Text style={[styles.diffAfter, { color: C.SUCCESS }]}>+{(after - before).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
        </Glass>
      )}
    </View>
  );
}

// ── 4. Forge ──────────────────────────────────────────────────────────────────
function ForgeTab({
  hero, faction, owned, gold, copies,
  effectiveRankKey, rankIdx, canFuse, canAffordFuse, fusionCost, fusionRankNext,
  forgeActive,
  heroData,
  onFuse, onConvert,
  fusionMsg,
}) {
  const rank    = RANK_COLORS[effectiveRankKey] || RANK_COLORS[hero.rank];
  const rate    = COINS_PER_COPY[effectiveRankKey] ?? COINS_PER_COPY.C;
  const maxConv = heroData?.copies ?? 0;
  const accent  = canFuse ? (RANK[fusionRankNext]?.bg ?? faction.color) : faction.color;

  return (
    // Video bleeds edge-to-edge — negative margin cancels tabArea's padding
    <View style={[styles.tabContent, styles.forgeTabFill]}>
      {/* Video — fills the entire tab */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}>
        <ForgeViz rank={effectiveRankKey} />
      </View>

      {/* Top-right rank badge */}
      <View style={styles.galaxyBadge} pointerEvents="none">
        <View style={[styles.rankChip, { backgroundColor: rank.bg + 'CC', borderColor: rank.glow + '80' }]}>
          <Text style={[styles.rankChipTxt, { color: rank.text }]}>{effectiveRankKey}</Text>
        </View>
        {canFuse && (
          <Text style={[styles.fuseHint, { color: RANK[fusionRankNext]?.glow ?? C.GOLD }]}>
            {effectiveRankKey} → {fusionRankNext}
          </Text>
        )}
        {hero.sovereign && (
          <Text style={[styles.fuseHint, { color: C.SOVEREIGN_GOLD }]}>✦ SOVEREIGN APEX</Text>
        )}
      </View>

      {/* Bottom action overlay — buttons float on the video */}
      <View style={styles.forgeOverlay} pointerEvents="box-none">
        {/* Gradient veil so buttons stay readable */}
        <LinearGradient
          colors={['transparent', C.OVERLAY_DEEP]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.forgeOverlayRow}>
          {/* Fusion button */}
          {owned && (
            <TouchableOpacity
              style={[
                styles.forgeOverlayBtn,
                {
                  borderColor: canAffordFuse ? accent + 'AA' : C.GLASS_7,
                  backgroundColor: canAffordFuse ? accent + '28' : C.OVERLAY_2,
                  opacity: !canFuse ? 0.45 : 1,
                },
              ]}
              onPress={canFuse && canAffordFuse ? onFuse : undefined}
              disabled={!canFuse || !canAffordFuse}
              activeOpacity={0.7}
            >
              <Ionicons name="git-merge-outline" size={13} color={canAffordFuse ? accent : C.TEXT_ON_DARK_DIM} />
              <View>
                <Text style={[styles.forgeOverlayLabel, { color: canAffordFuse ? accent : C.TEXT_ON_DARK_DIM }]}>
                  {canFuse ? 'FUSION' : hero.sovereign ? 'APEX LOCKED' : rankIdx >= 3 ? 'MAX RANK' : 'FUSION'}
                </Text>
                <Text style={styles.forgeOverlaySub}>
                  {canFuse
                    ? `${copies}/${FUSION_COPIES} copies · ${fusionCost.toLocaleString()} G`
                    : `Requires ${FUSION_COPIES} copies`}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Convert copies button */}
          {owned && maxConv > 0 && (
            <TouchableOpacity
              style={[styles.forgeOverlayBtn, {
                borderColor: C.GOLD + '88',
                backgroundColor: C.OVERLAY_2,
              }]}
              onPress={() => {
                Alert.alert(
                  'Convert Copies',
                  `Convert ${maxConv} ${hero.name} ${maxConv === 1 ? 'copy' : 'copies'} into ${maxConv * rate} Tower Coins?\n\n${rate} coins / copy · ${effectiveRankKey} rank.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: `Convert (+${maxConv * rate})`, onPress: () => onConvert(hero.id, maxConv) },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={13} color={C.GOLD} />
              <View>
                <Text style={[styles.forgeOverlayLabel, { color: C.GOLD }]}>CONVERT</Text>
                <Text style={styles.forgeOverlaySub}>×{maxConv} copies · {rate} coins each</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {fusionMsg !== '' && (
          <Text style={styles.forgeOverlayErr}>{fusionMsg}</Text>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function HeroDetailScreen({ route, navigation }) {
  const { heroId } = route.params || {};

  const ownedHeroes         = useGameStore(s => s.ownedHeroes);
  const team                = useGameStore(s => s.team);
  const addToTeam           = useGameStore(s => s.addToTeam);
  const getHeroData         = useGameStore(s => s.getHeroData);
  const levelUpHero         = useGameStore(s => s.levelUpHero);
  const gold                = useGameStore(s => s.gold);
  const trackQuestProgress  = useGameStore(s => s.trackQuestProgress);
  const fuseHero            = useGameStore(s => s.fuseHero);
  const transcendHero       = useGameStore(s => s.transcendHero);
  const getEffectiveRank    = useGameStore(s => s.getEffectiveRank);
  const ascendHero          = useGameStore(s => s.ascendHero);
  const ascensionInventory  = useGameStore(s => s.ascensionInventory);
  const convertExcessCopies = useGameStore(s => s.convertExcessCopies);

  const [activeTab,    setActiveTab]    = useState('profile');
  const [fusionMsg,    setFusionMsg]    = useState('');
  const [transcendMsg, setTranscendMsg] = useState('');
  const [ascendMsg,    setAscendMsg]    = useState('');
  const [statDiff,     setStatDiff]     = useState(null);
  const [forgeActive,  setForgeActive]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const cardRef       = useRef(null);
  const diffTimerRef  = useRef(null);

  useEffect(() => () => { if (diffTimerRef.current) clearTimeout(diffTimerRef.current); }, []);

  // ── Forge overlay animation refs ──────────────────────────────────────────
  const fuseFlash = useRef(new Animated.Value(0)).current;
  const fuseScale = useRef(new Animated.Value(1)).current;
  const fuseRing1 = useRef(new Animated.Value(0)).current;
  const fuseRing2 = useRef(new Animated.Value(0)).current;
  const fuseRing3 = useRef(new Animated.Value(0)).current;
  const fuseBadge = useRef(new Animated.Value(0)).current;
  const [forgeBadge, setForgeBadge] = useState({ topLabel: '', mainLabel: '', bg: C.GOLD, glow: C.GOLD, text: C.TEXT });

  const triggerForgeAnimation = useCallback(({ topLabel, mainLabel, bg, glow, text }) => {
    setForgeBadge({ topLabel, mainLabel, bg, glow, text });
    fuseFlash.setValue(0); fuseScale.setValue(1);
    fuseRing1.setValue(0); fuseRing2.setValue(0); fuseRing3.setValue(0);
    fuseBadge.setValue(0);
    AudioManager.playPowerForgeSFX();

    Animated.sequence([
      Animated.timing(fuseFlash, { toValue: 0.68, duration: 130, useNativeDriver: true }),
      Animated.timing(fuseFlash, { toValue: 0,    duration: 520, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(fuseScale, { toValue: 1.08, duration: 200, useNativeDriver: true }),
      Animated.spring(fuseScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start();
    [fuseRing1, fuseRing2, fuseRing3].forEach((ring, i) => {
      setTimeout(() => {
        ring.setValue(0);
        Animated.timing(ring, { toValue: 1, duration: 760, useNativeDriver: true }).start();
      }, i * 140);
    });
    setTimeout(() => {
      Animated.spring(fuseBadge, { toValue: 1, friction: 5, tension: 95, useNativeDriver: true }).start(() => {
        setTimeout(() => {
          Animated.timing(fuseBadge, { toValue: 0, duration: 380, useNativeDriver: true }).start();
        }, 980);
      });
    }, 190);
  }, []);

  const showStatDiff = useCallback((label, color, gains, transcendOnly = false) => {
    clearTimeout(diffTimerRef.current);
    setStatDiff({ label, color, gains, transcendOnly });
    diffTimerRef.current = setTimeout(() => setStatDiff(null), 3500);
  }, []);

  const handleDownload = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: hero.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (_) {}
    setSaving(false);
  };

  // ── Derived hero data ─────────────────────────────────────────────────────
  const cardHAvail = H - topInset - bottomInset - BODY_PAD * 2;
  const CARD_W = Math.floor(cardHAvail * (220 / 320));

  const hero    = HEROES.find(h => h.id === heroId);
  const faction = hero ? FACTIONS[hero.faction] : null;
  if (!hero || !faction) return null;

  const owned    = ownedHeroes.includes(hero.id);
  const inTeam   = team.includes(hero.id);
  const teamFull = !inTeam && team.length >= 3;

  const heroData      = owned ? getHeroData(hero.id) : { level: 1, copies: 1, effectiveRank: null, transcendence: 0, ascension: 0 };
  const copies        = heroData.copies       ?? 1;
  const level         = heroData.level        ?? 1;
  const transcendence = heroData.transcendence ?? 0;
  const ascension     = heroData.ascension    ?? 0;
  const maxLevel      = 10 + transcendence * 5;

  const effectiveRankKey = owned ? getEffectiveRank(hero.id) : hero.rank;
  const rank             = RANK_COLORS[effectiveRankKey] || RANK_COLORS[hero.rank];

  const levelMult = 1 + (level - 1) * 0.08;
  const ascMult   = ASCENSION_STAT_MULT[ascension] ?? 1;
  const rankKey   = hero.sovereign ? 'SOVEREIGN' : effectiveRankKey;
  const rankMult  = RANK_STAT_MULT[rankKey] ?? 1.0;
  const totalMult = levelMult * rankMult * ascMult;

  const levelCost  = level <= 10 ? 100 * level : 200 * (level - 10) + 1000;
  const isMaxLevel = level >= maxLevel;
  const canLevelUp = owned && !isMaxLevel && gold >= levelCost;

  const effectiveHp   = Math.round(hero.hp   * totalMult);
  const effectiveAtk  = Math.round(hero.atk  * totalMult);
  const effectiveDef  = Math.round(hero.def  * totalMult);
  const effectiveCrit = Math.round(hero.crit * totalMult);

  // Fusion
  const rankIdx        = RANK_ORDER.indexOf(effectiveRankKey);
  const canFuse        = owned && copies >= FUSION_COPIES && rankIdx >= 0 && rankIdx < 3;
  const fusionCosts    = [2000, 5000, 10000];
  const fusionCost     = fusionCosts[rankIdx] ?? 0;
  const fusionRankNext = canFuse ? RANK_ORDER[rankIdx + 1] : null;
  const canAffordFuse  = canFuse && gold >= fusionCost;

  // Transcendence
  const canTranscend        = owned && copies >= TRANSCEND_COPIES && transcendence < 4;
  const transcendCosts      = [8000, 15000, 25000, 40000];
  const transcendCost       = transcendCosts[transcendence] ?? 0;
  const canAffordTranscend  = canTranscend && gold >= transcendCost;

  // Ascension
  const ascItemId      = RANK_TO_ASCENSION_ITEM_ID[rankKey] ?? null;
  const requiredItem   = ascItemId ? getAscensionItemById(ascItemId) : null;
  const ownedItemCount = requiredItem ? ((ascensionInventory ?? {})[requiredItem.id] || 0) : 0;
  const canAscend      = owned && ascension < ASCENSION_MAX && ownedItemCount >= 1;
  const ascItemColor   = requiredItem ? (RANK[requiredItem.rankKey]?.bg ?? C.PRIMARY) : C.PRIMARY;

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleLevelUp = useCallback(() => {
    const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
    AudioManager.playLevelUpSFX();
    if (levelUpHero(hero.id)) {
      trackQuestProgress('hero_level');
      const nm = 1 + level * 0.08;
      const nt = nm * rankMult * ascMult;
      showStatDiff(`LV ${level} → ${level + 1}`, faction.color, [
        { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * nt), color: faction.color },
        { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * nt), color: faction.color },
        { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * nt), color: faction.color },
        { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * nt), color: faction.color },
      ]);
    }
  }, [effectiveHp, effectiveAtk, effectiveDef, effectiveCrit, level, rankMult, ascMult]);

  const handleFuse = useCallback(() => {
    const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
    const result = fuseHero(hero.id);
    if (result.ok) {
      const r = RANK[result.newRank];
      triggerForgeAnimation({ topLabel: 'RANK UP', mainLabel: result.newRank, bg: r?.bg ?? C.GOLD, glow: r?.glow ?? C.GOLD, text: r?.text ?? C.TEXT });
      setForgeActive(true);
      setTimeout(() => setForgeActive(false), 2200);
      const nm = RANK_STAT_MULT[result.newRank] ?? 1.0;
      const nt = levelMult * nm * ascMult;
      showStatDiff(`${effectiveRankKey} → ${result.newRank}  RANK UP`, r?.bg ?? C.GOLD, [
        { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * nt), color: faction.color },
        { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * nt), color: faction.color },
        { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * nt), color: faction.color },
        { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * nt), color: faction.color },
      ]);
    } else {
      setFusionMsg(result.reason === 'gold' ? 'Not enough gold' : result.reason === 'copies' ? `Need ${FUSION_COPIES} copies` : 'Cannot fuse');
      setTimeout(() => setFusionMsg(''), 2200);
    }
  }, [effectiveHp, effectiveAtk, effectiveDef, effectiveCrit, effectiveRankKey, levelMult, ascMult]);

  const handleTranscend = useCallback(() => {
    const result = transcendHero(hero.id);
    if (result.ok) {
      triggerForgeAnimation({ topLabel: 'TRANSCENDED', mainLabel: `LV ${result.newMaxLevel}`, bg: C.PRIMARY, glow: C.PRIMARY_LIGHT, text: C.TEXT });
      showStatDiff(`MAX LV ${maxLevel} → ${maxLevel + 5}`, C.PRIMARY_LIGHT, [], true);
    } else {
      setTranscendMsg(result.reason === 'gold' ? 'Not enough gold' : result.reason === 'copies' ? `Need ${TRANSCEND_COPIES} copies` : 'Cannot transcend');
      setTimeout(() => setTranscendMsg(''), 2200);
    }
  }, [maxLevel]);

  const handleAscend = useCallback(() => {
    const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
    const result = ascendHero(hero.id);
    if (result.ok) {
      triggerForgeAnimation({ topLabel: 'ASCENDED', mainLabel: `TIER ${result.newTier}`, bg: ascItemColor, glow: ascItemColor, text: C.TEXT });
      const na = ASCENSION_STAT_MULT[ascension + 1] ?? 1;
      const nt = levelMult * rankMult * na;
      showStatDiff(`ASCENSION TIER ${ascension} → ${result.newTier}`, ascItemColor, [
        { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * nt), color: faction.color },
        { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * nt), color: faction.color },
        { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * nt), color: faction.color },
        { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * nt), color: faction.color },
      ]);
    } else {
      setAscendMsg(result.reason === 'missing_item' ? `Need ${requiredItem?.name}` : 'Cannot ascend');
      setTimeout(() => setAscendMsg(''), 2200);
    }
  }, [effectiveHp, effectiveAtk, effectiveDef, effectiveCrit, ascension, ascItemColor, levelMult, rankMult]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Hero image — native blur so colours bleed through */}
      <Image
        source={hero.image}
        style={styles.bgImage}
        resizeMode="cover"
        blurRadius={22}
      />
      {/* BlurView adds frosted-glass finish on top */}
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Gradient veil — darker on right (text area) to guarantee legibility on light hero images */}
      <LinearGradient
        colors={[C.BG_DEEP + 'A0', C.BG_BASE + 'C8', C.BG_DEEP + 'A0']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[C.OVERLAY_2, C.OVERLAY_3]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <FactionParticles faction={hero.faction} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.body}>

          {/* LEFT — hero card */}
          <View style={[styles.cardCol, { width: CARD_W }]}>
            <Animated.View ref={cardRef} collapsable={false} style={{ transform: [{ scale: fuseScale }] }}>
              <HeroCard hero={hero} width={CARD_W} effectiveRank={effectiveRankKey} />
            </Animated.View>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={18} color={C.TEXT} />
            </TouchableOpacity>
          </View>

          {/* RIGHT — tab panel */}
          <View style={styles.infoCol}>
            {/* Static header */}
            <View style={styles.nameRow}>
              <View style={[styles.factionDot, { backgroundColor: faction.color }]} />
              <Text style={[styles.heroName, { color: faction.color }]} numberOfLines={1}>
                {hero.name.toUpperCase()}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                <Text style={[styles.rankTxt, { color: rank.text }]}>{effectiveRankKey}</Text>
              </View>
              {copies > 1 && (
                <View style={styles.copiesBadge}>
                  <Text style={styles.copiesTxt}>×{copies}</Text>
                </View>
              )}
            </View>

            <LinearGradient
              colors={[faction.color + '40', 'transparent']}
              style={styles.factionStrip}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />

            <View style={styles.tagRow}>
              <TagChip label={faction.label ?? hero.faction} color={faction.color} />
              <TagChip label={hero.class}   color={C.PRIMARY_LIGHT} />
              <TagChip label={hero.element} color={C.CYAN}          />
              <TagChip label={hero.effect}  color={C.SECONDARY}     />
            </View>

            {/* Tab bar */}
            <TabBar active={activeTab} onChange={setActiveTab} accent={faction.color} />

            {/* Tab content — fixed height, no scroll */}
            <View style={[styles.tabArea, activeTab === 'forge' && styles.tabAreaForge]}>
              {/* Frosted-glass background only on non-Forge tabs */}
              {activeTab !== 'forge' && (
                <>
                  <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
                  <View style={styles.tabAreaTint} pointerEvents="none" />
                </>
              )}
              {activeTab === 'profile' && (
                <ProfileTab
                  hero={hero} faction={faction} owned={owned}
                  inTeam={inTeam} teamFull={teamFull} addToTeam={addToTeam}
                  level={level} maxLevel={maxLevel}
                  transcendence={transcendence} ascension={ascension}
                  ascMult={ascMult} ascItemColor={ascItemColor}
                  effectiveHp={effectiveHp} effectiveAtk={effectiveAtk}
                  effectiveDef={effectiveDef} effectiveCrit={effectiveCrit}
                  saving={saving} saved={saved} handleDownload={handleDownload}
                />
              )}
              {activeTab === 'skills' && (
                <SkillsTab hero={hero} faction={faction} />
              )}
              {activeTab === 'level' && (
                <LevelTab
                  hero={hero} faction={faction} owned={owned} gold={gold}
                  level={level} maxLevel={maxLevel} levelCost={levelCost}
                  canLevelUp={canLevelUp} isMaxLevel={isMaxLevel} copies={copies}
                  transcendence={transcendence} canTranscend={canTranscend}
                  canAffordTranscend={canAffordTranscend} transcendCost={transcendCost}
                  ascension={ascension} canAscend={canAscend}
                  requiredItem={requiredItem} ownedItemCount={ownedItemCount} ascItemColor={ascItemColor}
                  onLevelUp={handleLevelUp} onTranscend={handleTranscend} onAscend={handleAscend}
                  fusionMsg={fusionMsg} transcendMsg={transcendMsg} ascendMsg={ascendMsg}
                  statDiff={statDiff}
                />
              )}
              {activeTab === 'forge' && (
                <ForgeTab
                  hero={hero} faction={faction} owned={owned} gold={gold} copies={copies}
                  effectiveRankKey={effectiveRankKey} rankIdx={rankIdx}
                  canFuse={canFuse} canAffordFuse={canAffordFuse}
                  fusionCost={fusionCost} fusionRankNext={fusionRankNext}
                  forgeActive={forgeActive}
                  heroData={heroData}
                  onFuse={handleFuse} onConvert={convertExcessCopies}
                  fusionMsg={fusionMsg}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Full-screen forge burst overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fuseFlash, backgroundColor: forgeBadge.bg }]} />
        {[fuseRing1, fuseRing2, fuseRing3].map((ring, i) => (
          <Animated.View key={i} style={[styles.fuseBurst, {
            borderColor: forgeBadge.glow,
            opacity: ring.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.65, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.05, 2.4 + i * 0.55] }) }],
          }]} />
        ))}
        <View style={styles.fuseBadgeWrap}>
          <Animated.View style={[styles.fuseBadgeCard, {
            opacity: fuseBadge,
            transform: [{ scale: fuseBadge.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
            borderColor: forgeBadge.glow,
            shadowColor: forgeBadge.glow,
          }]}>
            <LinearGradient colors={[forgeBadge.bg + '44', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={styles.fuseBadgeLbl}>{forgeBadge.topLabel}</Text>
            <Text style={[styles.fuseBadgeRank, {
              fontSize: (forgeBadge.mainLabel?.length ?? 0) <= 2 ? 64 : 36,
              color: forgeBadge.text, textShadowColor: forgeBadge.glow,
            }]}>{forgeBadge.mainLabel}</Text>
            <Text style={styles.fuseBadgeHero}>{hero.name.toUpperCase()}</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// ── Small sub-components ──────────────────────────────────────────────────────

function TagChip({ label, color }) {
  return (
    <View style={[shared.tagChip, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={[shared.tagTxt, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shared = StyleSheet.create({
  sHead: { fontSize: 9, color: C.TEXT_SOFT, fontWeight: '900', letterSpacing: 2.5, marginBottom: 5 },
  tagChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  tagTxt:  { fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
});

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.BG_DEEP },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.72 },
  safe: { flex: 1 },
  body: { flex: 1, flexDirection: 'row', padding: BODY_PAD, gap: 12 },

  cardCol: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backBtn: {
    position: 'absolute', top: 8, left: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.BG_CARD, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.BORDER, zIndex: 20,
  },

  infoCol: { flex: 1, flexDirection: 'column' },

  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  factionDot: { width: 8, height: 8, borderRadius: 4 },
  heroName:   { flex: 1, fontSize: 15, fontWeight: '900', letterSpacing: 2, color: C.TEXT },
  rankBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  rankTxt:    { fontSize: 11, fontWeight: '900', color: C.TEXT },
  copiesBadge:{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.PRIMARY_GLOW, borderWidth: 1, borderColor: C.BORDER_STRONG },
  copiesTxt:  { fontSize: 10, fontWeight: '900', color: C.PRIMARY_LIGHT },

  factionStrip: { height: 2, borderRadius: 1, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },

  tabArea: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.BORDER,
    padding: 6,
  },
  tabAreaForge: {
    borderRadius: 0,
    borderWidth: 0,
    padding: 0,
  },
  tabAreaTint: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.GLASS_3,
  },

  // ── Tab content shared ───────────────────────────────────────────────────
  tabContent:    { flex: 1, gap: 6 },
  forgeTabFill:  { position: 'relative', gap: 0 },

  // ── Profile ──────────────────────────────────────────────────────────────
  aboutCard: { paddingHorizontal: 10, paddingVertical: 8 },
  aboutTxt:  { fontSize: 11, color: C.TEXT, lineHeight: 16 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  statCell: {
    width: '48.5%', paddingHorizontal: 10, paddingVertical: 8,
    justifyContent: 'space-between',
  },
  statVal:     { fontSize: 20, fontWeight: '900', color: C.TEXT },
  statKey:     { fontSize: 9, fontWeight: '900', color: C.TEXT_SOFT, letterSpacing: 1.5, marginTop: -2 },
  statBarWrap: { marginTop: 5 },

  infoRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  infoPill: {
    paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  infoPillTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, color: C.TEXT },
  infoPillSub: { fontSize: 9, fontWeight: '900', color: C.TEXT },

  chipRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 2 },

  // ── Skills ───────────────────────────────────────────────────────────────
  skillCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 10, paddingVertical: 9,
  },
  skillCostBadge: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  skillCostTxt: { fontWeight: '900', fontSize: 13, color: C.TEXT },
  skillBody:    { flex: 1 },
  skillName:    { fontSize: 11, fontWeight: '800', color: C.TEXT, marginBottom: 1 },
  skillDesc:    { fontSize: 10, color: C.TEXT_SOFT, lineHeight: 14 },
  skillDmg: {
    backgroundColor: C.HP + '18', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  skillDmgTxt: { fontSize: 11, fontWeight: '900', color: C.HP },

  trumpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    flex: 1,
  },
  trumpLeft:   { flex: 1 },
  trumpLabel:  { fontSize: 9, fontWeight: '900', color: C.TEXT_SOFT, letterSpacing: 2, marginBottom: 2 },
  trumpName:   { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, color: C.TEXT },
  trumpEffect: { fontSize: 10, fontWeight: '700', flex: 1, lineHeight: 14, color: C.TEXT_SOFT },

  // ── Level ────────────────────────────────────────────────────────────────
  levelLayout: { flex: 1, flexDirection: 'row', gap: 6 },
  levelLeft:   { width: '38%' },
  levelRight:  { flex: 1, gap: 6 },

  levelRingCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 8,
  },

  ringOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  ringFill: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, overflow: 'hidden',
  },
  ringMask: {
    position: 'absolute', width: 80, height: 80,
    top: 0, right: 0,
    transformOrigin: 'left center',
  },
  ringCenter: { alignItems: 'center' },
  ringLevel:  { fontSize: 24, fontWeight: '900', lineHeight: 26, color: C.TEXT },
  ringMax:    { fontSize: 9, color: C.TEXT_SOFT, fontWeight: '700' },

  lvUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
  },
  lvUpTxt:   { fontSize: 10, fontWeight: '900', color: C.TEXT },
  lockedHint:{ fontSize: 9, color: C.TEXT_MUTED, fontWeight: '700' },

  upgradeCard: {
    flex: 1, padding: 10, gap: 3,
  },
  upgradeTop:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  upgradeName:    { flex: 1, fontSize: 9, fontWeight: '900', letterSpacing: 1, color: C.TEXT },
  upgradeBadge:   { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  upgradeBadgeTxt:{ fontSize: 9, fontWeight: '900', color: C.TEXT },
  upgradeSub:     { fontSize: 9, color: C.TEXT_SOFT, lineHeight: 13 },
  upgradeCost:    { fontSize: 9, fontWeight: '800', color: C.TEXT },
  upgradeBtn: {
    marginTop: 4, borderWidth: 1, borderRadius: 5,
    paddingVertical: 8, alignItems: 'center',
  },
  upgradeBtnTxt: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5, color: C.TEXT },
  upgradeHint:   { fontSize: 9, color: C.TEXT_SOFT, marginTop: 2 },
  upgradeErr:    { fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 2, color: C.TEXT_SOFT },
  ascTierRow:    { flexDirection: 'row', gap: 2 },
  ascStar:       { fontSize: 10 },

  diffPanel:  { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  diffHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  diffLabel:  { fontSize: 9, fontWeight: '900', letterSpacing: 0.6, color: C.TEXT },
  diffRow:    { flexDirection: 'row', gap: 8 },
  diffCell:   { flex: 1, alignItems: 'center' },
  diffStat:   { fontSize: 8, fontWeight: '900', letterSpacing: 0.5, color: C.TEXT },
  diffBefore: { fontSize: 9, color: C.TEXT_SOFT, fontWeight: '700' },
  diffAfter:  { fontSize: 9, fontWeight: '900', color: C.SUCCESS },
  diffNote:   { fontSize: 9, color: C.TEXT_SOFT, fontStyle: 'italic' },

  // ── Forge ────────────────────────────────────────────────────────────────
  galaxyWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  galaxyBadge: {
    position: 'absolute', top: 10, right: 10,
    alignItems: 'flex-end', gap: 4,
  },
  rankChip: {
    borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  rankChipTxt: { fontSize: 11, fontWeight: '900' },
  fuseHint:    { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  // ── Forge overlay (buttons on top of video) ──────────────────────────────
  forgeOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12, paddingTop: 28, paddingBottom: 10,
  },
  forgeOverlayRow: {
    flexDirection: 'row', gap: 10,
  },
  forgeOverlayBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  forgeOverlayLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: C.TEXT },
  forgeOverlaySub:   { fontSize: 8,  fontWeight: '600', color: C.TEXT_ON_DARK_SOFT,      marginTop: 1 },
  forgeOverlayErr:   { fontSize: 9, color: C.GOLD, fontWeight: '700', textAlign: 'center', marginTop: 6 },

  // ── Forge overlay ─────────────────────────────────────────────────────────
  fuseBurst: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2.5,
    top: H / 2 - 80, left: W / 2 - 80,
  },
  fuseBadgeWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  fuseBadgeCard: {
    borderRadius: 18, overflow: 'hidden', paddingHorizontal: 48, paddingVertical: 24,
    alignItems: 'center', borderWidth: 2, backgroundColor: C.BG_DEEP,
    shadowOpacity: 0.95, shadowOffset: { width: 0, height: 0 }, shadowRadius: 36, elevation: 16,
  },
  fuseBadgeLbl:  { fontSize: 10, fontWeight: '800', letterSpacing: 5, color: C.TEXT_SOFT, marginBottom: 6 },
  fuseBadgeRank: { fontWeight: '900', letterSpacing: 8, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
  fuseBadgeHero: { fontSize: 10, fontWeight: '700', color: C.TEXT_SOFT, letterSpacing: 1.5, marginTop: 8 },
});
