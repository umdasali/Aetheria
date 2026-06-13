import { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions, Animated, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import HeroCard from '../components/HeroCard';
import FactionParticles from '../components/FactionParticles';
import { HEROES, FACTIONS } from '../data/heroes';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import {
  ASCENSION_STAT_MULT, ASCENSION_MAX,
  RANK_TO_ASCENSION_ITEM_ID, getAscensionItemById,
} from '../data/ascensionItems';
import { RANK_STAT_MULT } from '../utils/battleEngine';
import { C, RANK, RANK_COLORS } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const BODY_PAD = 14;

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
  const [fusionMsg,    setFusionMsg]    = useState('');
  const [transcendMsg, setTranscendMsg] = useState('');
  const [ascendMsg,    setAscendMsg]    = useState('');
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [statDiff, setStatDiff] = useState(null);
  const statDiffTimer = useRef(null);

  useEffect(() => () => { if (statDiffTimer.current) clearTimeout(statDiffTimer.current); }, []);

  // Fusion animation refs
  const fuseFlash = useRef(new Animated.Value(0)).current;
  const fuseScale = useRef(new Animated.Value(1)).current;
  const fuseRing1 = useRef(new Animated.Value(0)).current;
  const fuseRing2 = useRef(new Animated.Value(0)).current;
  const fuseRing3 = useRef(new Animated.Value(0)).current;
  const fuseBadge = useRef(new Animated.Value(0)).current;
  const [forgeBadge, setForgeBadge] = useState({ topLabel: '', mainLabel: '', bg: C.GOLD, glow: C.GOLD, text: C.TEXT });

  const triggerForgeAnimation = ({ topLabel, mainLabel, bg, glow, text }) => {
    setForgeBadge({ topLabel, mainLabel, bg, glow, text });
    fuseFlash.setValue(0);
    fuseScale.setValue(1);
    fuseRing1.setValue(0);
    fuseRing2.setValue(0);
    fuseRing3.setValue(0);
    fuseBadge.setValue(0);

    AudioManager.playPowerForgeSFX();

    Animated.sequence([
      Animated.timing(fuseFlash, { toValue: 0.72, duration: 140, useNativeDriver: true }),
      Animated.timing(fuseFlash, { toValue: 0,    duration: 560, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(fuseScale, { toValue: 1.08, duration: 210, useNativeDriver: true }),
      Animated.spring(fuseScale,  { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
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
  };

  const handleDownload = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const tempUri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(tempUri, { mimeType: 'image/png', dialogTitle: hero.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (_) {}
    setSaving(false);
  };

  // Derive card width from actual available height (accounting for safe area insets)
  // so the card never overflows the column on notched devices.
  const cardHAvail = H - topInset - bottomInset - BODY_PAD * 2;
  const CARD_W = Math.floor(cardHAvail * (220 / 320));

  const hero    = HEROES.find((h) => h.id === heroId);
  const faction = hero ? FACTIONS[hero.faction] : null;

  if (!hero || !faction) return null;

  const owned    = ownedHeroes.includes(hero.id);
  const inTeam   = team.includes(hero.id);
  const teamFull = !inTeam && team.length >= 3;

  const heroData      = owned ? getHeroData(hero.id) : { level: 1, copies: 1, effectiveRank: null, transcendence: 0, ascension: 0 };
  const copies        = heroData.copies      ?? 1;
  const level         = heroData.level       ?? 1;
  const transcendence = heroData.transcendence ?? 0;
  const ascension     = heroData.ascension   ?? 0;
  const maxLevel      = 10 + transcendence * 5;
  const effectiveRankKey = owned ? getEffectiveRank(hero.id) : hero.rank;
  const rank          = RANK_COLORS[effectiveRankKey] || RANK_COLORS[hero.rank];

  const levelMult  = 1 + (level - 1) * 0.08;
  const ascMult    = ASCENSION_STAT_MULT[ascension] ?? 1;
  const rankKey    = hero.sovereign ? 'SOVEREIGN' : effectiveRankKey;
  const rankMult   = RANK_STAT_MULT[rankKey] ?? 1.0;
  const totalMult  = levelMult * rankMult * ascMult;

  const levelCost  = level <= 10 ? 100 * level : 200 * (level - 10) + 1000;
  const isMaxLevel = level >= maxLevel;
  const canLevelUp = owned && !isMaxLevel && gold >= levelCost;

  // ── Fusion ────────────────────────────────────────────────────────────────
  const RANK_ORDER  = ['C', 'B', 'A', 'S'];
  const rankIdx     = RANK_ORDER.indexOf(effectiveRankKey);
  const canFuse     = owned && copies >= 3 && rankIdx >= 0 && rankIdx < 3;
  const fusionCosts = [2000, 5000, 10000];
  const fusionCost  = fusionCosts[rankIdx] ?? 0;
  const fusionRankNext = canFuse ? RANK_ORDER[rankIdx + 1] : null;
  const canAffordFuse  = canFuse && gold >= fusionCost;

  // ── Transcendence ─────────────────────────────────────────────────────────
  const canTranscend      = owned && copies >= 5 && transcendence < 4;
  const transcendCosts    = [8000, 15000, 25000, 40000];
  const transcendCost     = transcendCosts[transcendence] ?? 0;
  const canAffordTranscend= canTranscend && gold >= transcendCost;

  // ── Ascension ─────────────────────────────────────────────────────────────
  // Use the sovereign-aware rankKey (L136) so Sovereigns require Aetheria's Core,
  // not the S-rank Feather — matches the ascendHero routing in the store.
  const ascItemId      = RANK_TO_ASCENSION_ITEM_ID[rankKey] ?? null;
  const requiredItem   = ascItemId ? getAscensionItemById(ascItemId) : null;
  const ownedItemCount = requiredItem ? ((ascensionInventory ?? {})[requiredItem.id] || 0) : 0;
  const canAscend      = owned && ascension < ASCENSION_MAX && ownedItemCount >= 1;
  const ascItemColor   = requiredItem ? (RANK[requiredItem.rankKey]?.bg ?? C.PRIMARY) : C.PRIMARY;

  const effectiveHp   = Math.round(hero.hp   * totalMult);
  const effectiveAtk  = Math.round(hero.atk  * totalMult);
  const effectiveDef  = Math.round(hero.def  * totalMult);
  const effectiveCrit = Math.round(hero.crit * totalMult);

  return (
    <View style={styles.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      {/* Faction-specific ambient particles */}
      <FactionParticles faction={hero.faction} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.body}>

          {/* Left — Hero card with floating back + download buttons */}
          <View style={[styles.cardCol, { width: CARD_W }]}>
            {/* Capture target — just the card, no overlaid buttons */}
            <Animated.View
              ref={cardRef}
              collapsable={false}
              style={{ transform: [{ scale: fuseScale }] }}
            >
              <HeroCard hero={hero} width={CARD_W} effectiveRank={effectiveRankKey} />
            </Animated.View>

            {/* Floating back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={18} color={C.TEXT} />
            </TouchableOpacity>
          </View>

          {/* Right — Info */}
          <ScrollView
            style={styles.infoCol}
            contentContainerStyle={styles.infoContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Name + rank */}
            <View style={styles.nameRow}>
              <View style={[styles.factionDot, { backgroundColor: faction.color }]} />
              <Text style={[styles.heroName, { color: faction.color }]} numberOfLines={1}>
                {hero.name.toUpperCase()}
              </Text>
              <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                <Text style={[styles.rankText, { color: rank.text }]}>{effectiveRankKey}</Text>
              </View>
              {copies > 1 && (
                <View style={styles.copiesBadge}>
                  <Text style={styles.copiesText}>×{copies}</Text>
                </View>
              )}
            </View>

            {/* Faction accent strip */}
            <LinearGradient
              colors={[faction.color + '40', 'transparent']}
              style={styles.factionStrip}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />

            {/* Tags */}
            <View style={styles.tagRow}>
              <TagChip label={faction.label ?? hero.faction} color={faction.color} />
              <TagChip label={hero.class}   color={C.PRIMARY_LIGHT} />
              <TagChip label={hero.element} color={C.CYAN}          />
              <TagChip label={hero.effect}  color={C.SECONDARY}     />
            </View>

            {/* About */}
            <View style={styles.section}>
              <SectionHead label="ABOUT" />
              <Text style={styles.aboutText}>{hero.about}</Text>
            </View>

            {/* Stats */}
            <View style={styles.section}>
              <View style={styles.statsHead}>
                <SectionHead label="STATS" />
                {owned && (
                  <View style={[styles.lvBadge, { backgroundColor: faction.color + '20', borderColor: faction.color + '55' }]}>
                    <Text style={[styles.lvBadgeText, { color: faction.color }]}>Lv. {level} / {maxLevel}</Text>
                    {transcendence > 0 && (
                      <Text style={[styles.lvBadgeText, { color: C.GOLD, marginLeft: 4 }]}>✦{transcendence}</Text>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.statsRow}>
                <StatBlock label="HP"   value={effectiveHp}   color={C.HP}   boosted={level > 1} />
                <StatBlock label="ATK"  value={effectiveAtk}  color={C.ATK}  boosted={level > 1} />
                <StatBlock label="DEF"  value={effectiveDef}  color={C.DEF}  boosted={level > 1} />
                <StatBlock label="CRIT" value={effectiveCrit} color={C.CRIT} boosted={level > 1} />
              </View>
            </View>

            {/* Stat diff panel — appears after any successful forge/level action */}
            {statDiff && (
              <View style={[styles.statDiffPanel, { borderColor: statDiff.color + '55', backgroundColor: statDiff.color + '0E' }]}>
                <View style={styles.statDiffHeader}>
                  <Ionicons name="trending-up" size={11} color={statDiff.color} />
                  <Text style={[styles.statDiffLabel, { color: statDiff.color }]}>{statDiff.label}</Text>
                </View>
                {statDiff.transcendOnly ? (
                  <Text style={styles.statDiffNote}>Level up further to unlock the additional potential</Text>
                ) : (
                  <View style={styles.statDiffGrid}>
                    {statDiff.gains.map(({ stat, before, after, color }) => (
                      <View key={stat} style={styles.statDiffRow}>
                        <Text style={[styles.statDiffStat, { color }]}>{stat}</Text>
                        <Text style={styles.statDiffBefore}>{before.toLocaleString()}</Text>
                        <Ionicons name="arrow-forward" size={9} color={C.SUCCESS} />
                        <Text style={[styles.statDiffAfter, { color: C.SUCCESS }]}>{after.toLocaleString()}</Text>
                        <Text style={[styles.statDiffGain, { color: C.SUCCESS }]}>+{(after - before).toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Level Up */}
            {owned && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={[
                    styles.levelUpBtn,
                    isMaxLevel
                      ? { borderColor: C.GOLD, backgroundColor: C.GOLD + '10' }
                      : canLevelUp
                      ? { borderColor: faction.color, backgroundColor: faction.color + '12' }
                      : { borderColor: C.BORDER, backgroundColor: C.BG_BASE },
                  ]}
                  onPress={canLevelUp ? () => {
                    const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
                    AudioManager.playLevelUpSFX();
                    const ok = levelUpHero(hero.id);
                    if (ok) {
                      trackQuestProgress('hero_level');
                      const newLevelMult = 1 + level * 0.08;
                      const newTotal = newLevelMult * rankMult * ascMult;
                      clearTimeout(statDiffTimer.current);
                      setStatDiff({
                        label: `LV ${level} → ${level + 1}`,
                        color: faction.color,
                        gains: [
                          { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * newTotal), color: C.HP   },
                          { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * newTotal), color: C.ATK  },
                          { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * newTotal), color: C.DEF  },
                          { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * newTotal), color: C.CRIT },
                        ],
                      });
                      statDiffTimer.current = setTimeout(() => setStatDiff(null), 3000);
                    }
                  } : undefined}
                  disabled={!canLevelUp}
                  activeOpacity={canLevelUp ? 0.75 : 1}
                >
                  {isMaxLevel ? (
                    <>
                      <Ionicons name="trophy" size={14} color={C.GOLD} />
                      <Text style={[styles.levelUpText, { color: C.GOLD }]}>MAX LEVEL</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="arrow-up-circle" size={14} color={canLevelUp ? faction.color : C.TEXT_DISABLED} />
                      <Text style={[styles.levelUpText, { color: canLevelUp ? faction.color : C.TEXT_DISABLED }]}>
                        Level Up  ·  {levelCost} Gold
                      </Text>
                      <Text style={[styles.levelUpSub, { color: canLevelUp ? C.TEXT_MUTED : C.TEXT_DISABLED }]}>
                        {gold} / {levelCost} available
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Fusion ──────────────────────────────────────────────────── */}
            {owned && (canFuse || canTranscend) && (
              <View style={styles.section}>
                <SectionHead label="POWER FORGE" />

                {/* Fusion button */}
                {canFuse && (
                  <TouchableOpacity
                    style={[
                      styles.forgeBtn,
                      { borderColor: canAffordFuse ? C.GOLD : C.BORDER,
                        backgroundColor: canAffordFuse ? C.GOLD + '12' : C.BG_BASE },
                    ]}
                    onPress={() => {
                      const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
                      const result = fuseHero(hero.id);
                      if (result.ok) {
                        const r = RANK[result.newRank];
                        triggerForgeAnimation({
                          topLabel: 'RANK UP',
                          mainLabel: result.newRank,
                          bg: r?.bg   ?? C.GOLD,
                          glow: r?.glow ?? C.GOLD,
                          text: r?.text ?? C.TEXT,
                        });
                        const newRankMult = RANK_STAT_MULT[result.newRank] ?? 1.0;
                        const newTotal = levelMult * newRankMult * ascMult;
                        clearTimeout(statDiffTimer.current);
                        setStatDiff({
                          label: `${effectiveRankKey} → ${result.newRank}  RANK UP`,
                          color: r?.bg ?? C.GOLD,
                          gains: [
                            { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * newTotal), color: C.HP   },
                            { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * newTotal), color: C.ATK  },
                            { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * newTotal), color: C.DEF  },
                            { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * newTotal), color: C.CRIT },
                          ],
                        });
                        statDiffTimer.current = setTimeout(() => setStatDiff(null), 3000);
                      } else {
                        setFusionMsg(
                          result.reason === 'gold'   ? 'Not enough gold'
                          : result.reason === 'copies' ? 'Need 3 copies'
                          : 'Cannot fuse'
                        );
                        setTimeout(() => setFusionMsg(''), 2200);
                      }
                    }}
                    disabled={!canAffordFuse}
                    activeOpacity={canAffordFuse ? 0.8 : 1}
                  >
                    <Ionicons name="git-merge-outline" size={15} color={canAffordFuse ? C.GOLD : C.TEXT_DISABLED} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.forgeBtnTitle, { color: canAffordFuse ? C.GOLD : C.TEXT_DISABLED }]}>
                        FUSION  ·  {effectiveRankKey} → {fusionRankNext}
                      </Text>
                      <Text style={styles.forgeBtnSub}>
                        Consumes 3 copies  ·  {fusionCost.toLocaleString()} Gold
                      </Text>
                    </View>
                    <Text style={[styles.forgeBtnCopies, { color: copies >= 3 ? C.GOLD : C.TEXT_DISABLED }]}>
                      {copies} / 3
                    </Text>
                  </TouchableOpacity>
                )}

                {fusionMsg !== '' && (
                  <Text style={styles.forgeMsg}>{fusionMsg}</Text>
                )}

                {/* Transcendence button */}
                {canTranscend && (
                  <TouchableOpacity
                    style={[
                      styles.forgeBtn,
                      { borderColor: canAffordTranscend ? C.PRIMARY : C.BORDER,
                        backgroundColor: canAffordTranscend ? C.PRIMARY + '12' : C.BG_BASE,
                        marginTop: canFuse ? 6 : 0 },
                    ]}
                    onPress={() => {
                      const result = transcendHero(hero.id);
                      if (result.ok) {
                        triggerForgeAnimation({
                          topLabel:  'TRANSCENDED',
                          mainLabel: `LV ${result.newMaxLevel}`,
                          bg:   C.PRIMARY,
                          glow: C.PRIMARY_LIGHT,
                          text: C.TEXT,
                        });
                        clearTimeout(statDiffTimer.current);
                        setStatDiff({
                          label: `MAX LV ${maxLevel} → ${maxLevel + 5}`,
                          color: C.PRIMARY_LIGHT,
                          transcendOnly: true,
                        });
                        statDiffTimer.current = setTimeout(() => setStatDiff(null), 3000);
                      } else {
                        setTranscendMsg(
                          result.reason === 'gold'   ? 'Not enough gold'
                          : result.reason === 'copies' ? 'Need 5 copies'
                          : 'Cannot transcend'
                        );
                        setTimeout(() => setTranscendMsg(''), 2200);
                      }
                    }}
                    disabled={!canAffordTranscend}
                    activeOpacity={canAffordTranscend ? 0.8 : 1}
                  >
                    <Ionicons name="arrow-up-circle" size={15} color={canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.forgeBtnTitle, { color: canAffordTranscend ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>
                        TRANSCEND  ·  Max Lv {maxLevel} → {maxLevel + 5}
                      </Text>
                      <Text style={styles.forgeBtnSub}>
                        Consumes 5 copies  ·  {transcendCost.toLocaleString()} Gold
                      </Text>
                    </View>
                    <Text style={[styles.forgeBtnCopies, { color: copies >= 5 ? C.PRIMARY_LIGHT : C.TEXT_DISABLED }]}>
                      {copies} / 5
                    </Text>
                  </TouchableOpacity>
                )}

                {transcendMsg !== '' && (
                  <Text style={[styles.forgeMsg, { color: C.PRIMARY_LIGHT }]}>{transcendMsg}</Text>
                )}
              </View>
            )}

            {/* ── Ascension ─────────────────────────────────────────────── */}
            {owned && (
              <View style={styles.section}>
                <View style={styles.ascHead}>
                  <SectionHead label="ASCENSION" />
                  <View style={styles.ascTierRow}>
                    {[1, 2, 3].map(t => (
                      <View
                        key={t}
                        style={[
                          styles.ascTierStar,
                          {
                            borderColor:     t <= ascension ? ascItemColor : C.BORDER,
                            backgroundColor: t <= ascension ? ascItemColor + '22' : 'transparent',
                          },
                        ]}
                      >
                        <Text style={[styles.ascTierStarTxt, { color: t <= ascension ? ascItemColor : C.TEXT_DISABLED }]}>
                          ★
                        </Text>
                      </View>
                    ))}
                    <Text style={styles.ascTierLabel}>{ascension} / 3</Text>
                    {ascension >= ASCENSION_MAX && (
                      <View style={[styles.ascMaxBadge, { backgroundColor: C.GOLD + '20', borderColor: C.GOLD + '55' }]}>
                        <Text style={[styles.ascMaxTxt, { color: C.GOLD }]}>MAX</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Stat boost line */}
                <Text style={styles.ascBoostLine}>
                  {'Stat boost: '}
                  <Text style={{ color: ascItemColor, fontWeight: '900' }}>
                    {ascension > 0 ? `+${Math.round((ascMult - 1) * 100)}%` : 'none'}
                  </Text>
                  {ascension < ASCENSION_MAX && (
                    <Text style={{ color: C.TEXT_MUTED }}>
                      {` → +${Math.round((ASCENSION_STAT_MULT[ascension + 1] - 1) * 100)}% on next tier`}
                    </Text>
                  )}
                </Text>

                {/* Required item preview + Ascend button */}
                {ascension < ASCENSION_MAX && requiredItem && (
                  <>
                    {/* Item card — shows exactly what the player needs */}
                    <View style={[styles.ascItemCard, { borderColor: ascItemColor + '40', backgroundColor: ascItemColor + '0C' }]}>
                      <LinearGradient
                        colors={[ascItemColor + '18', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      />
                      {/* Item image */}
                      <View style={[styles.ascItemImgWrap, { borderColor: ascItemColor + '50', backgroundColor: ascItemColor + '12' }]}>
                        <Image source={requiredItem.image} style={styles.ascItemImg} resizeMode="contain" />
                      </View>
                      {/* Info */}
                      <View style={styles.ascItemInfo}>
                        <View style={styles.ascItemNameRow}>
                          <View style={[styles.ascItemRankBadge, { backgroundColor: ascItemColor + '22', borderColor: ascItemColor + '55' }]}>
                            <Text style={[styles.ascItemRankTxt, { color: ascItemColor }]}>{requiredItem.rankLabel}</Text>
                          </View>
                          <Text style={[styles.ascItemName, { color: ascItemColor }]} numberOfLines={1}>
                            {requiredItem.name}
                          </Text>
                        </View>
                        <Text style={styles.ascItemLore} numberOfLines={2}>{requiredItem.lore}</Text>
                      </View>
                      {/* Owned badge */}
                      <View style={[
                        styles.ascOwnedBadge,
                        { backgroundColor: ownedItemCount >= 1 ? ascItemColor + '25' : C.BG_MID,
                          borderColor:     ownedItemCount >= 1 ? ascItemColor : C.BORDER },
                      ]}>
                        <Text style={[styles.ascOwnedNum, { color: ownedItemCount >= 1 ? ascItemColor : C.TEXT_DISABLED }]}>
                          {ownedItemCount}
                        </Text>
                        <Text style={styles.ascOwnedLbl}>owned</Text>
                      </View>
                    </View>

                    {/* Ascend button */}
                    <TouchableOpacity
                      style={[
                        styles.forgeBtn,
                        {
                          borderColor:     canAscend ? ascItemColor : C.BORDER,
                          backgroundColor: canAscend ? ascItemColor + '12' : C.BG_BASE,
                          marginTop: 6,
                        },
                      ]}
                      onPress={() => {
                        if (!canAscend) return;
                        const before = { hp: effectiveHp, atk: effectiveAtk, def: effectiveDef, crit: effectiveCrit };
                        const result = ascendHero(hero.id);
                        if (result.ok) {
                          triggerForgeAnimation({
                            topLabel:  'ASCENDED',
                            mainLabel: `TIER ${result.newTier}`,
                            bg:   ascItemColor,
                            glow: ascItemColor,
                            text: C.TEXT,
                          });
                          const newAscMult = ASCENSION_STAT_MULT[ascension + 1] ?? 1;
                          const newTotal = levelMult * rankMult * newAscMult;
                          clearTimeout(statDiffTimer.current);
                          setStatDiff({
                            label: `ASCENSION TIER ${ascension} → ${result.newTier}`,
                            color: ascItemColor,
                            gains: [
                              { stat: 'HP',   before: before.hp,   after: Math.round(hero.hp   * newTotal), color: C.HP   },
                              { stat: 'ATK',  before: before.atk,  after: Math.round(hero.atk  * newTotal), color: C.ATK  },
                              { stat: 'DEF',  before: before.def,  after: Math.round(hero.def  * newTotal), color: C.DEF  },
                              { stat: 'CRIT', before: before.crit, after: Math.round(hero.crit * newTotal), color: C.CRIT },
                            ],
                          });
                          statDiffTimer.current = setTimeout(() => setStatDiff(null), 3000);
                        } else {
                          setAscendMsg(
                            result.reason === 'missing_item' ? `Need ${requiredItem.name}`
                            : 'Cannot ascend'
                          );
                          setTimeout(() => setAscendMsg(''), 2200);
                        }
                      }}
                      disabled={!canAscend}
                      activeOpacity={canAscend ? 0.8 : 1}
                    >
                      <Ionicons name="sparkles" size={15} color={canAscend ? ascItemColor : C.TEXT_DISABLED} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.forgeBtnTitle, { color: canAscend ? ascItemColor : C.TEXT_DISABLED }]}>
                          {`ASCEND  ·  Tier ${ascension} → ${ascension + 1}`}
                        </Text>
                        <Text style={styles.forgeBtnSub}>
                          {`Consumes 1 × ${requiredItem.name}  ·  +${Math.round((ASCENSION_STAT_MULT[ascension + 1] - 1) * 100)}% all stats`}
                        </Text>
                      </View>
                      <Text style={[styles.forgeBtnCopies, { color: ownedItemCount >= 1 ? ascItemColor : C.TEXT_DISABLED }]}>
                        {ownedItemCount} / 1
                      </Text>
                    </TouchableOpacity>

                    {ascendMsg !== '' && (
                      <Text style={[styles.forgeMsg, { color: ascItemColor }]}>{ascendMsg}</Text>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Convert Excess Copies */}
            {owned && heroData.copies > 0 && (
              <TouchableOpacity
                style={styles.convertBtn}
                accessibilityLabel={`Convert ${heroData.copies} copies to ${heroData.copies * 100} gold`}
                accessibilityRole="button"
                onPress={() => {
                  Alert.alert(
                    'Convert Copies',
                    `Convert all ${heroData.copies} ${hero.name} ${heroData.copies === 1 ? 'copy' : 'copies'} into ${heroData.copies * 100} gold?\n\nThis cannot be undone.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: `Convert (+${heroData.copies * 100}G)`,
                        onPress: () => convertExcessCopies(hero.id, heroData.copies),
                      },
                    ]
                  );
                }}
              >
                <LinearGradient
                  colors={C.GRAD_GOLD}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.convertBtnInner}
                >
                  <Text style={styles.convertBtnText}>
                    ♻ Convert {heroData.copies} {heroData.copies === 1 ? 'Copy' : 'Copies'} → {heroData.copies * 100}G
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Skills */}
            <View style={styles.section}>
              <SectionHead label="SKILLS" />
              {hero.skills.map((sk, i) => (
                <View key={i} style={styles.skillRow}>
                  <View style={[styles.skillCost, { borderColor: faction.color, backgroundColor: faction.color + '18' }]}>
                    <Text style={[styles.skillCostText, { color: faction.color }]}>{sk.cost}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillName}>{sk.name}</Text>
                    <Text style={styles.skillDesc}>{sk.description}</Text>
                  </View>
                  {sk.damage > 0 && (
                    <View style={styles.skillDmgBadge}>
                      <Text style={styles.skillDmgText}>{sk.damage}×</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Trump card */}
            <View style={styles.section}>
              <SectionHead label="TRUMP CARD" />
              <View style={[styles.trumpBox, { borderColor: faction.color + '55' }]}>
                <LinearGradient
                  colors={[faction.color + '22', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.trumpName, { color: C.GOLD }]}>
                  {hero.trumpCard.name.toUpperCase()}
                </Text>
                <Text style={[styles.trumpEffect, { color: faction.color }]}>
                  ✦ {hero.trumpCard.effect}
                </Text>
              </View>
            </View>

            {/* Team button */}
            {owned && (
              <TouchableOpacity
                style={[
                  styles.teamBtn,
                  teamFull
                    ? { borderColor: C.BORDER_STRONG, backgroundColor: C.BG_BASE }
                    : {
                        borderColor: inTeam ? C.DANGER : faction.color,
                        backgroundColor: inTeam ? C.DANGER + '18' : faction.color + '18',
                      },
                ]}
                onPress={teamFull ? undefined : () => addToTeam(hero.id)}
                disabled={teamFull}
                activeOpacity={teamFull ? 1 : 0.75}
              >
                <Ionicons
                  name={inTeam ? 'remove-circle-outline' : teamFull ? 'people-outline' : 'add-circle-outline'}
                  size={16}
                  color={inTeam ? C.DANGER : teamFull ? C.TEXT_MUTED : faction.color}
                />
                <Text style={[styles.teamBtnText, {
                  color: inTeam ? C.DANGER : teamFull ? C.TEXT_MUTED : faction.color,
                }]}>
                  {inTeam ? 'REMOVE FROM TEAM' : teamFull ? 'TEAM FULL  (3 / 3)' : 'ADD TO TEAM'}
                </Text>
              </TouchableOpacity>
            )}

            {!owned && (
              <View style={styles.lockedBanner}>
                <Ionicons name="lock-closed" size={14} color={C.GOLD} />
                <Text style={styles.lockedText}>Unlock via Summon</Text>
              </View>
            )}

            {/* Share card — visible for owned heroes */}
            {owned && (
              <TouchableOpacity
                style={[
                  styles.shareBtn,
                  saved && { borderColor: C.SUCCESS, backgroundColor: C.SUCCESS + '18' },
                ]}
                onPress={handleDownload}
                disabled={saving}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={saved ? 'checkmark-done-outline' : saving ? 'hourglass-outline' : 'share-social-outline'}
                  size={16}
                  color={saved ? C.SUCCESS : C.TEXT_MUTED}
                />
                <Text style={[styles.shareBtnText, saved && { color: C.SUCCESS }]}>
                  {saved ? 'SHARED!' : saving ? 'SHARING…' : 'SHARE CARD'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* ── Power forge animation overlay (fusion / transcend / ascend) ─────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Screen flash */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: fuseFlash, backgroundColor: forgeBadge.bg }]}
        />

        {/* Expanding burst rings */}
        {[fuseRing1, fuseRing2, fuseRing3].map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.fuseBurst,
              {
                borderColor: forgeBadge.glow,
                opacity: ring.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.65, 0] }),
                transform: [{
                  scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.05, 2.4 + i * 0.55] }),
                }],
              },
            ]}
          />
        ))}

        {/* Centered forge badge */}
        <View style={styles.fuseBadgeWrap}>
          <Animated.View
            style={[
              styles.fuseBadgeCard,
              {
                opacity: fuseBadge,
                transform: [{ scale: fuseBadge.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
                borderColor: forgeBadge.glow,
                shadowColor: forgeBadge.glow,
              },
            ]}
          >
            <LinearGradient
              colors={[forgeBadge.bg + '44', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.fuseBadgeLabel}>{forgeBadge.topLabel}</Text>
            <Text
              style={[
                styles.fuseBadgeRankText,
                {
                  fontSize: (forgeBadge.mainLabel?.length ?? 0) <= 2 ? 66 : 38,
                  color:           forgeBadge.text,
                  textShadowColor: forgeBadge.glow,
                },
              ]}
            >
              {forgeBadge.mainLabel}
            </Text>
            <Text style={styles.fuseBadgeHeroName}>{hero.name.toUpperCase()}</Text>
          </Animated.View>
        </View>
      </View>

    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHead({ label }) {
  return <Text style={styles.sectionHead}>{label}</Text>;
}

function TagChip({ label, color }) {
  return (
    <View style={[styles.tagChip, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function StatBlock({ label, value, color, boosted }) {
  return (
    <View style={[styles.statBlock, { borderColor: color + '40' }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
      {boosted && <Text style={[styles.statBoost, { color }]}>▲</Text>}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  body: {
    flex: 1,
    flexDirection: 'row',
    padding: BODY_PAD,
    gap: 14,
  },

  // Card column — width applied inline (CARD_W computed per-render with safe area insets)
  cardCol: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Floating back button overlaid on card top-left
  backBtn: {
    position: 'absolute',
    top: 8, left: 8,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: C.BG_CARD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.BORDER,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  // Floating download button overlaid on card top-right
  downloadBtn: {
    position: 'absolute',
    top: 8, right: 8,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: C.BG_CARD,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.BORDER,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  // Info column
  infoCol: { flex: 1 },
  infoContent: { paddingBottom: 8 },

  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 8,
  },
  factionDot: { width: 9, height: 9, borderRadius: 5 },
  heroName: {
    flex: 1, fontSize: 16, fontWeight: '900', letterSpacing: 2,
  },
  rankBadge:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 5 },
  rankText:    { fontSize: 12, fontWeight: '900' },
  copiesBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
    backgroundColor: C.PRIMARY_GLOW, borderWidth: 1, borderColor: C.BORDER_STRONG,
  },
  copiesText: { fontSize: 11, fontWeight: '900', color: C.PRIMARY_LIGHT },

  statsHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 7,
  },
  lvBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1,
  },
  lvBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  statBoost: { fontSize: 6, fontWeight: '900', marginTop: 1 },

  levelUpBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 14,
  },
  levelUpText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5, flex: 1 },
  levelUpSub:  { fontSize: 9, fontWeight: '600', textAlign: 'right' },

  factionStrip: {
    height: 3, borderRadius: 2, marginBottom: 10,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 },
  tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  section:     { marginBottom: 12 },
  sectionHead: {
    fontSize: 8, color: C.TEXT_MUTED,
    fontWeight: '800', letterSpacing: 2.5, marginBottom: 7,
  },

  aboutText: {
    fontSize: 11, color: C.TEXT_SOFT, lineHeight: 17,
  },

  statsRow:  { flexDirection: 'row', gap: 6 },
  statBlock: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, backgroundColor: C.BG_BASE,
  },
  statVal: { fontSize: 16, fontWeight: '900' },
  statLbl: { fontSize: 7, color: C.TEXT_MUTED, fontWeight: '800', letterSpacing: 1, marginTop: 2 },

  skillRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginBottom: 6, padding: 9, borderRadius: 8,
    backgroundColor: C.BG_BASE,
    borderWidth: 1, borderColor: C.BORDER,
  },
  skillCost: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    marginTop: 1,
  },
  skillCostText: { fontWeight: '900', fontSize: 12 },
  skillName:     { color: C.TEXT, fontWeight: '700', fontSize: 12, marginBottom: 2 },
  skillDesc:     { color: C.TEXT_MUTED, fontSize: 10, lineHeight: 14 },
  skillDmgBadge: {
    backgroundColor: C.HP + '18',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    marginTop: 2,
  },
  skillDmgText: { color: C.HP, fontWeight: '900', fontSize: 11 },

  trumpBox: {
    borderRadius: 9, padding: 12,
    borderWidth: 1, overflow: 'hidden', position: 'relative',
    backgroundColor: C.BG_BASE,
  },
  trumpName:   { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  trumpEffect: { fontSize: 11, fontWeight: '700', lineHeight: 15 },

  teamBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 11, marginBottom: 8,
  },
  teamBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },

  forgeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  forgeBtnTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  forgeBtnSub:   { fontSize: 9, color: C.TEXT_MUTED, marginTop: 2 },
  forgeBtnCopies:{ fontSize: 12, fontWeight: '900' },
  forgeMsg:      { fontSize: 10, color: C.GOLD, fontWeight: '700', textAlign: 'center', marginTop: 4 },

  statDiffPanel:  { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 },
  statDiffHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  statDiffLabel:  { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  statDiffGrid:   { gap: 3 },
  statDiffRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDiffStat:   { fontSize: 9, fontWeight: '900', width: 30, letterSpacing: 0.5 },
  statDiffBefore: { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '700', minWidth: 34, textAlign: 'right' },
  statDiffAfter:  { fontSize: 9, fontWeight: '900', minWidth: 34, textAlign: 'right' },
  statDiffGain:   { fontSize: 9, fontWeight: '900', minWidth: 30 },
  statDiffNote:   { fontSize: 9, color: C.TEXT_MUTED, fontStyle: 'italic' },

  ascHead:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ascTierRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ascTierStar:   { width: 22, height: 22, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ascTierStarTxt:{ fontSize: 12, lineHeight: 14 },
  ascTierLabel:  { fontSize: 10, fontWeight: '900', color: C.TEXT_MUTED, marginLeft: 4 },
  ascMaxBadge:   { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, marginLeft: 4 },
  ascMaxTxt:     { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  ascBoostLine:  { fontSize: 10, color: C.TEXT_MUTED, marginBottom: 6 },

  // Item preview card
  ascItemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, borderWidth: 1, overflow: 'hidden',
    paddingVertical: 9, paddingHorizontal: 10, marginBottom: 2,
    position: 'relative',
  },
  ascItemImgWrap: {
    width: 48, height: 48, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ascItemImg: { width: 38, height: 38 },
  ascItemInfo: { flex: 1, gap: 3 },
  ascItemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ascItemRankBadge: { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1 },
  ascItemRankTxt: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  ascItemName: { fontSize: 11, fontWeight: '900', flex: 1 },
  ascItemLore: { fontSize: 9, color: C.TEXT_MUTED, lineHeight: 13 },
  ascOwnedBadge: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0,
  },
  ascOwnedNum: { fontSize: 16, fontWeight: '900', lineHeight: 18 },
  ascOwnedLbl: { fontSize: 7, color: C.TEXT_MUTED, fontWeight: '700', letterSpacing: 0.3 },

  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
    backgroundColor: C.BG_BASE, borderRadius: 10,
    borderWidth: 1, borderColor: C.BORDER,
  },
  lockedText: { color: C.GOLD, fontSize: 11, fontWeight: '700' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderWidth: 1, borderRadius: 10, borderColor: C.BORDER,
    paddingVertical: 10, marginTop: 6, backgroundColor: C.BG_BASE,
  },
  shareBtnText: { fontSize: 11, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1 },

  // ── Convert copies ───────────────────────────────────────────────────────────
  convertBtn:      { borderRadius: 8, overflow: 'hidden', marginTop: 6 },
  convertBtnInner: { paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  convertBtnText:  { color: C.TEXT, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },

  // ── Fusion animation ─────────────────────────────────────────────────────────
  fuseBurst: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2.5,
    top: H / 2 - 80,
    left: W / 2 - 80,
  },
  fuseBadgeWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuseBadgeCard: {
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 48,
    paddingVertical: 26,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: C.BG_DEEP,
    shadowOpacity: 0.95,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 36,
    elevation: 16,
  },
  fuseBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 5,
    color: C.TEXT_MUTED,
    marginBottom: 8,
  },
  fuseBadgeRankText: {
    fontSize: 66,
    fontWeight: '900',
    letterSpacing: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  fuseBadgeHeroName: {
    fontSize: 11,
    fontWeight: '700',
    color: C.TEXT_MUTED,
    letterSpacing: 1.5,
    marginTop: 10,
  },
});
