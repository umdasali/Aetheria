import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import HeroCard from '../components/HeroCard';
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
const BODY_PAD = 12;
const RANK_ORDER = ['C', 'B', 'A', 'S'];
const STAT_ABS_MAX = { HP: 25000, ATK: 3000, DEF: 2500, CRIT: 2500 };
const COINS_PER_COPY = { SOVEREIGN: 200, S: 80, A: 35, B: 15, C: 8 };

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
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
});

// ── Progress bar ──────────────────────────────────────────────────────────────
function StatBar({ value, max, color, height = 7 }) {
  const [trackW, setTrackW] = useState(0);
  const fillAnim = useRef(new Animated.Value(0)).current;

  const onLayout = useCallback((e) => setTrackW(e.nativeEvent.layout.width), []);

  useEffect(() => {
    if (trackW === 0) return;
    const target = Math.round(Math.min(value / max, 1) * trackW);
    Animated.timing(fillAnim, { toValue: target, duration: 900, useNativeDriver: false }).start();
  }, [trackW, value, max]);

  return (
    <View
      onLayout={onLayout}
      style={[sb.track, { height, borderRadius: height / 2, backgroundColor: color + '1A' }]}
    >
      <Animated.View style={[sb.fill, { width: fillAnim, backgroundColor: color, borderRadius: height / 2 }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
const sb = StyleSheet.create({
  track: { overflow: 'hidden', position: 'relative' },
  fill:  { height: '100%', position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
});

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile', label: 'PROFILE', icon: 'person-outline' },
  { key: 'skills',  label: 'SKILLS',  icon: 'flash-outline' },
  { key: 'level',   label: 'LEVEL',   icon: 'trending-up-outline' },
  { key: 'forge',   label: 'FORGE',   icon: 'git-merge-outline' },
];

function TabBar({ active, onChange }) {
  return (
    <View style={tb.row}>
      {TABS.map(t => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={tb.tab} onPress={() => { AudioManager.playButtonSFX(); onChange(t.key); }} activeOpacity={0.7}>
            <Ionicons name={t.icon} size={13} color={on ? C.PRIMARY_LIGHT : C.TEXT_MUTED} />
            <Text style={[tb.label, { color: on ? C.PRIMARY_LIGHT : C.TEXT_MUTED }]}>{t.label}</Text>
            {on && <View style={tb.bar} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const tb = StyleSheet.create({
  row:   { flexDirection: 'row', backgroundColor: C.BG_STATS, borderRadius: 8, borderWidth: 1, borderColor: C.BORDER_SUBTLE, marginBottom: 8 },
  tab:   { flex: 1, alignItems: 'center', paddingVertical: 7, gap: 2 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  bar:   { height: 2, width: '50%', borderRadius: 1, marginTop: 2, backgroundColor: C.PRIMARY_LIGHT },
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB CONTENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileTab({
  hero, owned, inTeam, teamFull, addToTeam,
  level, maxLevel, transcendence, ascension, ascMult,
  effectiveHp, effectiveAtk, effectiveDef, effectiveCrit,
  saving, saved, handleDownload,
}) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.aboutTxt} numberOfLines={2}>{hero.about}</Text>

      <View style={styles.statGrid}>
        {[
          { key: 'HP',   val: effectiveHp },
          { key: 'ATK',  val: effectiveAtk },
          { key: 'DEF',  val: effectiveDef },
          { key: 'CRIT', val: effectiveCrit },
        ].map(({ key, val }) => (
          <View key={key} style={styles.statCell}>
            <Text style={styles.statVal}>{val.toLocaleString()}</Text>
            <Text style={styles.statKey}>{key}</Text>
            <View style={styles.statBarWrap}>
              <StatBar value={val} max={STAT_ABS_MAX[key]} color={C.PRIMARY} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoPill}>
          <Text style={styles.infoPillTxt}>Lv.{level}/{maxLevel}</Text>
          {transcendence > 0 && <Text style={[styles.infoPillSub, { color: C.GOLD }]}>✦{transcendence}</Text>}
        </View>
        {ascension > 0 && (
          <View style={styles.infoPill}>
            <Text style={styles.infoPillTxt}>★{ascension}  +{Math.round((ascMult - 1) * 100)}%</Text>
          </View>
        )}
        {hero.element && (
          <View style={styles.infoPill}>
            <Text style={[styles.infoPillTxt, { color: C.CYAN }]}>{hero.element}</Text>
          </View>
        )}
      </View>

      <View style={styles.chipRow}>
        {owned ? (
          <>
            <Chip
              icon={inTeam ? 'remove-circle-outline' : teamFull ? 'people-outline' : 'add-circle-outline'}
              label={inTeam ? 'REMOVE' : teamFull ? 'TEAM FULL' : 'ADD TO TEAM'}
              color={inTeam ? C.DANGER : teamFull ? C.TEXT_MUTED : C.PRIMARY}
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

function SkillsTab({ hero }) {
  return (
    <View style={styles.tabContent}>
      {hero.skills.map((sk, i) => {
        const energyCost = sk.cost * 20;
        const isHeal = sk.damage === 0;
        const isAOE  = sk.damage > 0 && /\ball\b|enemies|every/i.test(sk.description);
        const typeLabel = isHeal ? 'HEAL' : isAOE ? 'AOE' : 'ATK';
        const typeColor = isHeal ? C.SUCCESS : isAOE ? C.SECONDARY : C.PRIMARY_LIGHT;
        return (
          <View key={i} style={styles.skillCard}>
            <View style={styles.skillNumBadge}>
              <Text style={styles.skillNumTxt}>{i + 1}</Text>
              <Text style={styles.skillNrgTxt}>{energyCost}E</Text>
            </View>
            <View style={styles.skillBody}>
              <View style={styles.skillNameRow}>
                <Text style={styles.skillName}>{sk.name}</Text>
                <View style={[styles.skillTypePill, { backgroundColor: typeColor + '20', borderColor: typeColor + '60' }]}>
                  <Text style={[styles.skillTypeTxt, { color: typeColor }]}>{typeLabel}</Text>
                </View>
              </View>
              <Text style={styles.skillDesc} numberOfLines={2}>{sk.description}</Text>
            </View>
            {sk.damage > 0 ? (
              <View style={styles.skillDmg}>
                <Text style={styles.skillDmgTxt}>{sk.damage}×</Text>
              </View>
            ) : (
              <View style={[styles.skillDmg, { borderColor: C.SUCCESS + '55' }]}>
                <Ionicons name="heart-outline" size={13} color={C.SUCCESS} />
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.trumpCard}>
        <View style={styles.trumpIconWrap}>
          <Ionicons name="flash" size={16} color={C.GOLD} />
        </View>
        <View style={styles.trumpLeft}>
          <Text style={styles.trumpLabel}>TRUMP CARD</Text>
          <Text style={styles.trumpName}>{hero.trumpCard.name.toUpperCase()}</Text>
          <Text style={styles.trumpEffect} numberOfLines={2}>{hero.trumpCard.effect}</Text>
        </View>
        <View style={[styles.skillDmg, styles.trumpDmgWrap]}>
          <Text style={[styles.skillDmgTxt, { color: C.GOLD }]}>{hero.trumpCard.damage}×</Text>
          <Text style={styles.trumpDmgAll}>ALL</Text>
        </View>
      </View>
    </View>
  );
}

function LevelTab({
  hero, owned,
  level, maxLevel, levelCost, canLevelUp, isMaxLevel, copies,
  transcendence, canTranscend, canAffordTranscend, transcendCost,
  ascension, canAscend, requiredItem, ownedItemCount, ascItemColor,
  onLevelUp, onTranscend, onAscend,
  transcendMsg, ascendMsg,
}) {
  const pct = Math.min(100, Math.round((level / maxLevel) * 100));
  return (
    <View style={styles.tabContent}>

      {/* ── Level progress card ────────────────────────────────────────────── */}
      <View style={[styles.lvCard, styles.card]}>
        {/* Top row: label + big number + percent */}
        <View style={styles.lvTopRow}>
          <Text style={styles.lvCaption}>LEVEL</Text>
          <View style={styles.lvNumWrap}>
            <Text style={styles.lvNum}>{level}</Text>
            <Text style={styles.lvDenom}>/ {maxLevel}</Text>
          </View>
          <View style={styles.lvPctWrap}>
            <Text style={styles.lvPct}>{pct}%</Text>
          </View>
        </View>

        {/* Progress bar — taller, full width */}
        <View style={styles.lvBarWrap}>
          <StatBar value={level} max={maxLevel} color={C.PRIMARY} height={9} />
        </View>

        {/* Level-up button */}
        {owned ? (
          <TouchableOpacity
            style={[styles.lvBtn, isMaxLevel
              ? { borderColor: C.GOLD + '60', backgroundColor: C.GOLD + '12' }
              : canLevelUp
              ? { borderColor: C.PRIMARY + '80', backgroundColor: C.PRIMARY + '20' }
              : { borderColor: C.BORDER_SUBTLE, backgroundColor: C.BG_STATS }
            ]}
            onPress={canLevelUp ? onLevelUp : undefined}
            disabled={!canLevelUp || isMaxLevel}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isMaxLevel ? 'trophy-outline' : 'arrow-up-circle-outline'}
              size={15}
              color={isMaxLevel ? C.GOLD : canLevelUp ? C.PRIMARY_LIGHT : C.TEXT_DISABLED}
            />
            <Text style={[styles.lvBtnTxt, {
              color: isMaxLevel ? C.GOLD : canLevelUp ? C.PRIMARY_LIGHT : C.TEXT_DISABLED,
            }]}>
              {isMaxLevel
                ? 'MAX LEVEL'
                : canLevelUp
                ? `LEVEL UP  ·  ${levelCost.toLocaleString()} G`
                : `NEED  ${levelCost.toLocaleString()} G`}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.lvBtn, { borderColor: C.BORDER_SUBTLE, backgroundColor: C.BG_STATS }]}>
            <Ionicons name="lock-closed-outline" size={15} color={C.TEXT_DISABLED} />
            <Text style={[styles.lvBtnTxt, { color: C.TEXT_DISABLED }]}>UNLOCK TO LEVEL</Text>
          </View>
        )}
      </View>

      {/* ── Transcend + Ascend row ─────────────────────────────────────────── */}
      <View style={styles.upgradeRow}>

        {/* Transcend */}
        <View style={[styles.upgradeCard2, styles.card, { opacity: !owned ? 0.45 : 1 }]}>
          <View style={styles.upgradeHead2}>
            <View style={[styles.upgradeIconBox, { backgroundColor: canAffordTranscend ? C.PRIMARY + '20' : C.BG_STATS }]}>
              <Ionicons name="arrow-up-circle-outline" size={15} color={canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle2, { color: canAffordTranscend ? C.TEXT : C.TEXT_DISABLED }]}>TRANSCEND</Text>
              <Text style={styles.upgradeSub2}>Lv cap  {maxLevel} → {maxLevel + 5}</Text>
            </View>
            <View style={[styles.copyBadge, { backgroundColor: copies >= TRANSCEND_COPIES ? C.PRIMARY + '28' : C.BG_STATS }]}>
              <Text style={[styles.copyBadgeTxt, { color: copies >= TRANSCEND_COPIES ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>
                {copies}/{TRANSCEND_COPIES}
              </Text>
            </View>
          </View>

          <View style={styles.upgradeDivider} />

          <View style={styles.upgradeFoot2}>
            <Text style={[styles.upgradeCost2, { color: canAffordTranscend ? C.GOLD : C.TEXT_DISABLED }]}>
              {transcendCost.toLocaleString()} G
            </Text>
            {owned && canTranscend ? (
              <TouchableOpacity
                style={[styles.upgradeActionBtn, canAffordTranscend
                  ? { borderColor: C.PRIMARY + '80', backgroundColor: C.PRIMARY + '22' }
                  : { borderColor: C.BORDER_SUBTLE, backgroundColor: 'transparent' }
                ]}
                onPress={canAffordTranscend ? onTranscend : undefined}
                disabled={!canAffordTranscend}
                activeOpacity={0.75}
              >
                <Text style={[styles.upgradeActionTxt, { color: canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>
                  {canAffordTranscend ? 'TRANSCEND' : 'NEED GOLD'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.upgradeNote2}>
                {!owned ? 'Unlock first' : transcendence >= 4 ? 'MAX REACHED' : `${copies}/${TRANSCEND_COPIES} copies`}
              </Text>
            )}
          </View>
          {transcendMsg !== '' && <Text style={[styles.upgradeErr2, { color: C.PRIMARY_LIGHT }]}>{transcendMsg}</Text>}
        </View>

        {/* Ascend */}
        <View style={[styles.upgradeCard2, styles.card, { opacity: !owned ? 0.45 : 1 }]}>
          <View style={styles.upgradeHead2}>
            <View style={[styles.upgradeIconBox, { backgroundColor: canAscend ? ascItemColor + '20' : C.BG_STATS }]}>
              <Ionicons name="sparkles-outline" size={15} color={canAscend ? ascItemColor : C.TEXT_DISABLED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle2, { color: canAscend ? C.TEXT : C.TEXT_DISABLED }]}>ASCEND</Text>
              <Text style={styles.upgradeSub2}>{requiredItem ? requiredItem.name : 'Item required'}</Text>
            </View>
            <View style={styles.ascStarRow}>
              {[1, 2, 3].map(t => (
                <Text key={t} style={[styles.ascStar2, { color: t <= ascension ? ascItemColor : C.TEXT_DISABLED }]}>★</Text>
              ))}
            </View>
          </View>

          <View style={styles.upgradeDivider} />

          <View style={styles.upgradeFoot2}>
            <Text style={[styles.upgradeCost2, { color: ownedItemCount >= 1 ? ascItemColor : C.TEXT_DISABLED }]}>
              {ownedItemCount} / 1 item
            </Text>
            {owned && ascension < ASCENSION_MAX && requiredItem ? (
              <TouchableOpacity
                style={[styles.upgradeActionBtn, canAscend
                  ? { borderColor: ascItemColor + '80', backgroundColor: ascItemColor + '22' }
                  : { borderColor: C.BORDER_SUBTLE, backgroundColor: 'transparent' }
                ]}
                onPress={canAscend ? onAscend : undefined}
                disabled={!canAscend}
                activeOpacity={0.75}
              >
                <Text style={[styles.upgradeActionTxt, { color: canAscend ? ascItemColor : C.TEXT_DISABLED }]}>
                  {canAscend ? `ASCEND  T${ascension + 1}` : 'NEED ITEM'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.upgradeNote2, ascension >= ASCENSION_MAX && { color: C.GOLD }]}>
                {ascension >= ASCENSION_MAX ? 'MAX TIER' : !owned ? 'Unlock first' : 'No item'}
              </Text>
            )}
          </View>
          {ascendMsg !== '' && <Text style={[styles.upgradeErr2, { color: ascItemColor }]}>{ascendMsg}</Text>}
        </View>
      </View>

    </View>
  );
}

function ForgeTab({
  hero, owned, copies,
  effectiveRankKey, rankIdx, canFuse, canAffordFuse, fusionCost, fusionRankNext,
  heroData, onFuse, onConvert, fusionMsg,
}) {
  const rankKey = hero.sovereign ? 'SOVEREIGN' : effectiveRankKey;
  const rank    = RANK_COLORS[effectiveRankKey] || RANK_COLORS[hero.rank];
  const rate    = COINS_PER_COPY[effectiveRankKey] ?? COINS_PER_COPY.C;
  const maxConv = heroData?.copies ?? 0;
  const accent  = canFuse ? (RANK[fusionRankNext]?.bg ?? C.PRIMARY) : C.PRIMARY;

  return (
    <View style={[styles.tabContent, styles.forgeTabFill]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}>
        <ForgeViz rank={rankKey} />
      </View>

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

      <View style={styles.forgeOverlay} pointerEvents="box-none">
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.forgeOverlayRow}>
          {owned && (
            <TouchableOpacity
              style={[styles.forgeOverlayBtn, {
                borderColor: canAffordFuse ? accent + 'AA' : C.GLASS_7,
                backgroundColor: canAffordFuse ? accent + '28' : C.OVERLAY_2,
                opacity: !canFuse ? 0.45 : 1,
              }]}
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
                  {canFuse ? `${copies}/${FUSION_COPIES} copies · ${fusionCost.toLocaleString()} G` : `Requires ${FUSION_COPIES} copies`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {owned && maxConv > 0 && (
            <TouchableOpacity
              style={[styles.forgeOverlayBtn, { borderColor: C.GOLD + '88', backgroundColor: C.OVERLAY_2 }]}
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
        {fusionMsg !== '' && <Text style={styles.forgeOverlayErr}>{fusionMsg}</Text>}
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
  const [, setForgeActive] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const cardRef      = useRef(null);
  const diffTimerRef = useRef(null);

  useEffect(() => () => { if (diffTimerRef.current) clearTimeout(diffTimerRef.current); }, []);

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

  // ── Derived data ──────────────────────────────────────────────────────────
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

  const rankIdx        = RANK_ORDER.indexOf(effectiveRankKey);
  const canFuse        = owned && copies >= FUSION_COPIES && rankIdx >= 0 && rankIdx < 3;
  const fusionCosts    = [2000, 5000, 10000];
  const fusionCost     = fusionCosts[rankIdx] ?? 0;
  const fusionRankNext = canFuse ? RANK_ORDER[rankIdx + 1] : null;
  const canAffordFuse  = canFuse && gold >= fusionCost;

  const canTranscend       = owned && copies >= TRANSCEND_COPIES && transcendence < 4;
  const transcendCosts     = [8000, 15000, 25000, 40000];
  const transcendCost      = transcendCosts[transcendence] ?? 0;
  const canAffordTranscend = canTranscend && gold >= transcendCost;

  const ascItemId      = RANK_TO_ASCENSION_ITEM_ID[rankKey] ?? null;
  const requiredItem   = ascItemId ? getAscensionItemById(ascItemId) : null;
  const ownedItemCount = requiredItem ? ((ascensionInventory ?? {})[requiredItem.id] || 0) : 0;
  const canAscend      = owned && ascension < ASCENSION_MAX && ownedItemCount >= 1;
  const ascItemColor   = requiredItem ? (RANK[requiredItem.rankKey]?.bg ?? C.PRIMARY) : C.PRIMARY;

  const handleLevelUp = useCallback(() => {
    const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
    AudioManager.playLevelUpSFX();
    if (levelUpHero(hero.id)) {
      trackQuestProgress('hero_level');
      const nm = 1 + level * 0.08;
      const nt = nm * rankMult * ascMult;
      showStatDiff(`LV ${level} → ${level + 1}`, C.PRIMARY_LIGHT, [
        { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * nt), color: C.PRIMARY_LIGHT },
        { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * nt), color: C.PRIMARY_LIGHT },
        { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * nt), color: C.PRIMARY_LIGHT },
        { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * nt), color: C.PRIMARY_LIGHT },
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
        { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * nt), color: C.PRIMARY_LIGHT },
        { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * nt), color: C.PRIMARY_LIGHT },
        { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * nt), color: C.PRIMARY_LIGHT },
        { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * nt), color: C.PRIMARY_LIGHT },
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
        { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * nt), color: C.PRIMARY_LIGHT },
        { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * nt), color: C.PRIMARY_LIGHT },
        { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * nt), color: C.PRIMARY_LIGHT },
        { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * nt), color: C.PRIMARY_LIGHT },
      ]);
    } else {
      setAscendMsg(result.reason === 'missing_item' ? `Need ${requiredItem?.name}` : 'Cannot ascend');
      setTimeout(() => setAscendMsg(''), 2200);
    }
  }, [effectiveHp, effectiveAtk, effectiveDef, effectiveCrit, ascension, ascItemColor, levelMult, rankMult]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

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

          {/* RIGHT — info panel */}
          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <View style={[styles.rankDot, { backgroundColor: rank.bg }]} />
              <Text style={styles.heroName} numberOfLines={1}>{hero.name.toUpperCase()}</Text>
              <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                <Text style={[styles.rankTxt, { color: rank.text }]}>{effectiveRankKey}</Text>
              </View>
              {copies > 1 && (
                <View style={styles.copiesBadge}>
                  <Text style={styles.copiesTxt}>×{copies}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.tagRow}>
              <TagChip label={faction.label ?? hero.faction} color={C.TEXT_MUTED} />
              <TagChip label={hero.class}   color={C.PRIMARY_LIGHT} />
              <TagChip label={hero.element} color={C.CYAN} />
              <TagChip label={hero.effect}  color={C.SECONDARY} />
            </View>

            <TabBar active={activeTab} onChange={setActiveTab} />

            <View style={[styles.tabArea, activeTab === 'forge' && styles.tabAreaForge]}>
              {activeTab === 'profile' && (
                <ProfileTab
                  hero={hero} owned={owned}
                  inTeam={inTeam} teamFull={teamFull} addToTeam={addToTeam}
                  level={level} maxLevel={maxLevel}
                  transcendence={transcendence} ascension={ascension} ascMult={ascMult}
                  effectiveHp={effectiveHp} effectiveAtk={effectiveAtk}
                  effectiveDef={effectiveDef} effectiveCrit={effectiveCrit}
                  saving={saving} saved={saved} handleDownload={handleDownload}
                />
              )}
              {activeTab === 'skills' && <SkillsTab hero={hero} />}
              {activeTab === 'level' && (
                <LevelTab
                  hero={hero} owned={owned}
                  level={level} maxLevel={maxLevel} levelCost={levelCost}
                  canLevelUp={canLevelUp} isMaxLevel={isMaxLevel} copies={copies}
                  transcendence={transcendence} canTranscend={canTranscend}
                  canAffordTranscend={canAffordTranscend} transcendCost={transcendCost}
                  ascension={ascension} canAscend={canAscend}
                  requiredItem={requiredItem} ownedItemCount={ownedItemCount} ascItemColor={ascItemColor}
                  onLevelUp={handleLevelUp} onTranscend={handleTranscend} onAscend={handleAscend}
                  transcendMsg={transcendMsg} ascendMsg={ascendMsg}
                />
              )}
              {activeTab === 'forge' && (
                <ForgeTab
                  hero={hero} owned={owned} copies={copies}
                  effectiveRankKey={effectiveRankKey} rankIdx={rankIdx}
                  canFuse={canFuse} canAffordFuse={canAffordFuse}
                  fusionCost={fusionCost} fusionRankNext={fusionRankNext}
                  heroData={heroData}
                  onFuse={handleFuse} onConvert={convertExcessCopies}
                  fusionMsg={fusionMsg}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Forge burst overlay */}
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
            {statDiff && !statDiff.transcendOnly && statDiff.gains.length > 0 && (
              <View style={styles.fuseBadgeStats}>
                {statDiff.gains.map(({ stat, before, after }) => (
                  <View key={stat} style={styles.fuseBadgeStatCell}>
                    <Text style={[styles.fuseBadgeStatName, { color: forgeBadge.glow }]}>{stat}</Text>
                    <Text style={styles.fuseBadgeStatBefore}>{before.toLocaleString()}</Text>
                    <Text style={styles.fuseBadgeStatAfter}>→ {after.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
            {statDiff?.transcendOnly && (
              <Text style={styles.fuseBadgeStatNote}>Level cap extended</Text>
            )}
          </Animated.View>
        </View>
      </View>

    </View>
  );
}

function TagChip({ label, color }) {
  return (
    <View style={[shared.tagChip, { borderColor: color + '55', backgroundColor: color + '12' }]}>
      <Text style={[shared.tagTxt, { color }]}>{label}</Text>
    </View>
  );
}

const shared = StyleSheet.create({
  sHead:   { fontSize: 9, color: C.TEXT_SOFT, fontWeight: '900', letterSpacing: 2.5, marginBottom: 5 },
  tagChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  tagTxt:  { fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
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
  rankDot:    { width: 8, height: 8, borderRadius: 4 },
  heroName:   { flex: 1, fontSize: 16, fontWeight: '900', letterSpacing: 2, color: C.TEXT },
  rankBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  rankTxt:    { fontSize: 11, fontWeight: '900' },
  copiesBadge:{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.PRIMARY_GLOW, borderWidth: 1, borderColor: C.BORDER_STRONG },
  copiesTxt:  { fontSize: 10, fontWeight: '900', color: C.PRIMARY_LIGHT },

  divider: { height: 1, backgroundColor: C.BORDER_SUBTLE, marginBottom: 8 },
  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },

  tabArea: {
    flex: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER_SUBTLE,
    backgroundColor: C.BG_BASE, padding: 10,
  },
  tabAreaForge: { borderRadius: 0, borderWidth: 0, padding: 0, backgroundColor: 'transparent' },

  tabContent:   { flex: 1, gap: 8 },
  forgeTabFill: { position: 'relative', gap: 0 },

  card: {
    backgroundColor: C.BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.BORDER_SUBTLE,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // ── Profile ──────────────────────────────────────────────────────────────
  aboutTxt:  { fontSize: 11, color: C.TEXT_SOFT, lineHeight: 16 },
  statGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  statCell: {
    width: '48.5%', paddingHorizontal: 10, paddingVertical: 8,
    justifyContent: 'space-between',
    backgroundColor: C.BG_CARD, borderRadius: 8,
    borderWidth: 1, borderColor: C.BORDER_SUBTLE,
  },
  statVal:     { fontSize: 20, fontWeight: '900', color: C.TEXT },
  statKey:     { fontSize: 9, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 1.5, marginTop: -2 },
  statBarWrap: { marginTop: 5 },
  infoRow:     { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  infoPill:    { paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoPillTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, color: C.TEXT_SOFT },
  infoPillSub: { fontSize: 9, fontWeight: '900', color: C.TEXT },
  chipRow:     { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 2 },

  // ── Skills ───────────────────────────────────────────────────────────────
  skillCard: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: C.BG_CARD, borderRadius: 10,
    borderWidth: 1, borderColor: C.BORDER_SUBTLE,
  },
  skillNumBadge: {
    width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.PRIMARY + '40', backgroundColor: C.BG_STATS,
  },
  skillNumTxt:  { fontSize: 14, fontWeight: '900', lineHeight: 16, color: C.PRIMARY_LIGHT },
  skillNrgTxt:  { fontSize: 7, fontWeight: '800', letterSpacing: 0.3, marginTop: -2, color: C.TEXT_MUTED },
  skillNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  skillTypePill:{ borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1 },
  skillTypeTxt: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  skillBody:    { flex: 1 },
  skillName:    { fontSize: 11, fontWeight: '800', color: C.TEXT },
  skillDesc:    { fontSize: 10, color: C.TEXT_SOFT, lineHeight: 14 },
  skillDmg: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 6,
    alignItems: 'center', justifyContent: 'center', minWidth: 36,
    borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_STATS,
  },
  skillDmgTxt: { fontSize: 11, fontWeight: '900', color: C.TEXT_SOFT },

  trumpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, flex: 1,
    backgroundColor: C.BG_CARD, borderRadius: 10,
    borderWidth: 1, borderColor: C.GOLD + '40',
  },
  trumpIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: C.GOLD + '22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.GOLD + '55',
  },
  trumpLeft:   { flex: 1 },
  trumpLabel:  { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.5, marginBottom: 1 },
  trumpName:   { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2, color: C.GOLD },
  trumpEffect: { fontSize: 9, fontWeight: '700', lineHeight: 13, color: C.TEXT_SOFT },
  trumpDmgWrap:{ gap: 1 },
  trumpDmgAll: { fontSize: 7, fontWeight: '900', color: C.GOLD, letterSpacing: 0.8, textAlign: 'center' },

  // ── Level ────────────────────────────────────────────────────────────────
  lvCard:    { padding: 12, gap: 8 },
  lvTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lvCaption: { fontSize: 8, fontWeight: '800', letterSpacing: 2.5, color: C.TEXT_MUTED },
  lvNumWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  lvNum:     { fontSize: 32, fontWeight: '900', lineHeight: 34, color: C.TEXT },
  lvDenom:   { fontSize: 12, fontWeight: '700', color: C.TEXT_SOFT, marginBottom: 3 },
  lvPctWrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.PRIMARY + '18', borderWidth: 1, borderColor: C.PRIMARY + '40' },
  lvPct:     { fontSize: 10, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 0.4 },
  lvBarWrap: { width: '100%' },
  lvBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, width: '100%',
  },
  lvBtnTxt: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  upgradeRow:   { flex: 1, flexDirection: 'row', gap: 8 },
  upgradeCard2: { flex: 1, padding: 10, gap: 6 },
  upgradeHead2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upgradeIconBox: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeTitle2:  { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: C.TEXT, marginBottom: 1 },
  upgradeSub2:    { fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 0.2 },
  copyBadge:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  copyBadgeTxt:   { fontSize: 9, fontWeight: '900' },
  ascStarRow:     { flexDirection: 'row', gap: 1 },
  ascStar2:       { fontSize: 12 },
  upgradeDivider: { height: 1, backgroundColor: C.BORDER_SUBTLE },
  upgradeFoot2:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  upgradeCost2:   { fontSize: 10, fontWeight: '800' },
  upgradeActionBtn: {
    borderWidth: 1, borderRadius: 6,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  upgradeActionTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  upgradeNote2:     { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '700' },
  upgradeErr2:      { fontSize: 9, fontWeight: '700', textAlign: 'center', color: C.TEXT_SOFT },

  fuseBadgeStats: {
    flexDirection: 'row', gap: 10, marginTop: 14,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: C.BORDER_SUBTLE,
  },
  fuseBadgeStatCell:   { alignItems: 'center', gap: 2, minWidth: 48 },
  fuseBadgeStatName:   { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  fuseBadgeStatBefore: { fontSize: 9, color: C.TEXT_SOFT, fontWeight: '700' },
  fuseBadgeStatAfter:  { fontSize: 10, fontWeight: '900', color: C.SUCCESS },
  fuseBadgeStatNote:   { fontSize: 9, color: C.TEXT_SOFT, fontStyle: 'italic', marginTop: 10 },

  // ── Forge ────────────────────────────────────────────────────────────────
  galaxyBadge:    { position: 'absolute', top: 10, right: 10, alignItems: 'flex-end', gap: 4 },
  rankChip:       { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  rankChipTxt:    { fontSize: 11, fontWeight: '900' },
  fuseHint:       { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  forgeOverlay:   { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 28, paddingBottom: 10 },
  forgeOverlayRow:{ flexDirection: 'row', gap: 10 },
  forgeOverlayBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  forgeOverlayLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: C.TEXT },
  forgeOverlaySub:   { fontSize: 9, fontWeight: '600', color: C.TEXT_ON_DARK, marginTop: 1 },
  forgeOverlayErr:   { fontSize: 9, color: C.GOLD, fontWeight: '700', textAlign: 'center', marginTop: 6 },

  fuseBurst: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2.5,
    top: H / 2 - 80, left: W / 2 - 80,
  },
  fuseBadgeWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  fuseBadgeCard: {
    borderRadius: 18, overflow: 'hidden', paddingHorizontal: 48, paddingVertical: 24,
    alignItems: 'center', borderWidth: 2, backgroundColor: C.BG_DEEP,
    shadowOpacity: 0.95, shadowOffset: { width: 0, height: 0 }, shadowRadius: 36, elevation: 16,
  },
  fuseBadgeLbl:  { fontSize: 10, fontWeight: '800', letterSpacing: 5, color: C.TEXT_SOFT, marginBottom: 6 },
  fuseBadgeRank: { fontWeight: '900', letterSpacing: 8, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
  fuseBadgeHero: { fontSize: 10, fontWeight: '700', color: C.TEXT_SOFT, letterSpacing: 1.5, marginTop: 8 },
});
