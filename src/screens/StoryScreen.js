import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
} from 'react-native';

const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../store/gameStore';
import { CHAPTER_DEFS, STORY_STAGES, STAGE_ORDER, getStagesForChapter, getStageById, isStageUnlocked, stageGoldReward } from '../data/story';
import { ENEMY_GROUPS } from '../data/enemies';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const SIDEBAR_W  = 172;
const PART_LABEL = ['', 'Part  I', 'Part  II', 'Part  III'];
const PART_ICON  = ['', 'shield-outline', 'flame-outline', 'skull'];

// ── Chapter tab — memoized so only the tabs whose state changed re-render ────
const ChapterTab = memo(function ChapterTab({ ch, accessible, done, active, onSelect }) {
  const tabColor = ch.color || C.PRIMARY;
  return (
    <TouchableOpacity
      style={[styles.chTab, active && { borderColor: tabColor }]}
      onPress={() => { if (accessible) onSelect(ch.id); }}
      activeOpacity={accessible ? 0.8 : 1}
    >
      <LinearGradient
        colors={active ? [tabColor + '30', tabColor + '18'] : ['transparent', 'transparent']}
        style={styles.chTabGrad}
      >
        <View style={styles.chTabTop}>
          <View style={[styles.chNumBadge, { backgroundColor: active ? tabColor + '30' : C.PRIMARY_GLOW }]}>
            <Text style={[styles.chNum, { color: active ? tabColor : C.TEXT_MUTED }]}>{ch.id}</Text>
          </View>
          {done ? (
            <Ionicons name="checkmark-circle" size={14} color={done && active ? tabColor : C.SUCCESS} />
          ) : !accessible ? (
            <Ionicons name="lock-closed" size={13} color={C.TEXT_DISABLED} />
          ) : null}
        </View>
        <Text style={[styles.chTabTitle, active && { color: C.TEXT }]} numberOfLines={1}>
          {ch.title}
        </Text>
        <Text style={[styles.chTabSub, active && { color: 'rgba(255,255,255,0.65)' }]} numberOfLines={2}>
          {ch.subtitle}
        </Text>
        {active && <View style={[styles.chTabAccent, { backgroundColor: tabColor }]} />}
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default function StoryScreen({ navigation }) {
  const completedChapters  = useGameStore(s => s.completedChapters);
  const isChapterCompleted = useGameStore(s => s.isChapterCompleted);
  const [selectedChId, setSelectedChId] = useState(1);

  const isUnlocked  = (sid) => isStageUnlocked(sid, completedChapters);
  const isCompleted = (sid) => completedChapters.includes(sid);

  // Chapter is accessible once the previous chapter is fully done (chapter 1 always open)
  const isChAccessible = (cid) => {
    if (cid === 1) return true;
    return isChapterCompleted(cid - 1);
  };

  // Story BGM — start on focus, stop on blur
  useFocusEffect(
    useCallback(() => {
      AudioManager.startStoryBGM();
      return () => AudioManager.stopStoryBGM();
    }, [])
  );

  // Auto-select the next uncompleted chapter each time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      for (const stageId of STAGE_ORDER) {
        if (!completedChapters.includes(stageId)) {
          const s = getStageById(stageId);
          if (s) { setSelectedChId(s.chapterId); return; }
        }
      }
      // All stages done — stay on the last chapter
      setSelectedChId(CHAPTER_DEFS[CHAPTER_DEFS.length - 1].id);
    }, [completedChapters])
  );

  // Navigate to full-screen narration instead of showing a modal
  const handleStagePress = (stage) => {
    if (!isUnlocked(stage.id)) return;
    AudioManager.playButtonSFX();
    const group = ENEMY_GROUPS.find((g) => g.id === stage.enemyGroupId);
    navigation.navigate('Narration', { stage, enemyGroup: group });
  };

  const selectedCh   = CHAPTER_DEFS.find((c) => c.id === selectedChId);
  const stagesToShow = getStagesForChapter(selectedChId);
  const chColor      = selectedCh?.color  || C.PRIMARY;
  const chAccent     = selectedCh?.accent || C.PRIMARY_LIGHT;

  // ── Chapter tab ────────────────────────────────────────────────────────────
  const handleSelectCh = useCallback((chId) => {
    AudioManager.playButtonSFX();
    setSelectedChId(chId);
  }, []);

  const renderChTab = (ch) => (
    <ChapterTab
      key={ch.id}
      ch={ch}
      accessible={isChAccessible(ch.id)}
      done={isChapterCompleted(ch.id)}
      active={selectedChId === ch.id}
      onSelect={handleSelectCh}
    />
  );

  // ── Part card ──────────────────────────────────────────────────────────────
  const renderPartCard = (stage) => {
    const unlocked  = isUnlocked(stage.id);
    const completed = isCompleted(stage.id);
    const isBoss    = stage.part === 3;
    const cardAccentColor = isBoss ? C.DANGER : chColor;

    return (
      <TouchableOpacity
        key={stage.id}
        style={[
          styles.partCard,
          { borderColor: isBoss ? 'rgba(220,38,38,0.35)' : chColor + '30' },
          completed && styles.partCardDone,
          !unlocked && styles.partCardLocked,
        ]}
        onPress={() => handleStagePress(stage)}
        activeOpacity={unlocked ? 0.8 : 1}
      >
        <LinearGradient
          colors={
            completed ? ['rgba(5,150,105,0.12)', C.BG_BASE]
            : isBoss  ? ['rgba(220,38,38,0.08)', C.BG_BASE]
            :           [chColor + '10', C.BG_BASE]
          }
          style={styles.partCardGrad}
        >
          {/* Part badge row */}
          <View style={styles.partTop}>
            <View style={[styles.partBadge, {
              backgroundColor: cardAccentColor + '18',
              borderColor: cardAccentColor,
            }]}>
              <Ionicons name={PART_ICON[stage.part]} size={10} color={cardAccentColor} />
              <Text style={[styles.partBadgeTxt, { color: cardAccentColor }]}>
                {PART_LABEL[stage.part]}
              </Text>
            </View>

            {completed ? (
              <Ionicons name="checkmark-circle" size={16} color={C.SUCCESS} />
            ) : !unlocked ? (
              <Ionicons name="lock-closed" size={15} color={C.TEXT_DISABLED} />
            ) : isBoss ? (
              <View style={styles.bossTag}>
                <Text style={styles.bossTagTxt}>BOSS</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.stageTitle, !unlocked && styles.lockedTxt]} numberOfLines={1}>
            {stage.title}
          </Text>
          <Text style={[styles.stageDesc, !unlocked && styles.lockedTxt]} numberOfLines={2}>
            {stage.description}
          </Text>

          {/* Rewards */}
          <View style={styles.rewardRow}>
            <Image source={GEM_IMG} style={styles.rewardIcon} resizeMode="contain" />
            <Text style={styles.rewardGems}>{stage.rewards.gems}</Text>
            <Image source={GOLD_IMG} style={[styles.rewardIcon, { marginLeft: 5 }]} resizeMode="contain" />
            <Text style={[styles.rewardGems, { color: C.GOLD }]}>
              {stageGoldReward(stage.part)}
            </Text>
            {stage.rewards.heroId && (
              <>
                <Ionicons name="person-add" size={11} color={chColor} style={{ marginLeft: 5 }} />
                <Text style={[styles.rewardGems, { color: chColor }]}>Hero</Text>
              </>
            )}
            {/* Gold value — keep in sync with stageGoldReward() */}
          </View>

          {/* Enter button */}
          {unlocked && (
            <TouchableOpacity style={styles.enterBtn} onPress={() => handleStagePress(stage)}>
              <LinearGradient
                colors={isBoss ? [C.DANGER, C.DANGER_MID] : [chColor, chColor + 'CC']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.enterBtnInner}
              >
                <Ionicons name={completed ? 'refresh' : 'play'} size={12} color={C.TEXT} />
                <Text style={styles.enterBtnTxt}>{completed ? 'Replay' : 'Enter'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* Header */}
        <LinearGradient colors={C.GRAD_HEADER} style={styles.header}>
          <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Home'); }} style={styles.hdrBack}>
            <Ionicons name="chevron-back" size={22} color={C.TEXT} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.hdrTitle}>STORY MODE</Text>
            <Text style={styles.hdrSub}>The Void War Chronicles · {CHAPTER_DEFS.length} Chapters · {STAGE_ORDER.length} Stages</Text>
          </View>
          <View style={styles.progressPill}>
            <Ionicons name="trophy-outline" size={12} color={C.GOLD} />
            <Text style={styles.progressTxt}>{completedChapters.length} / {STAGE_ORDER.length}</Text>
          </View>
        </LinearGradient>

        {/* Body: sidebar + parts */}
        <View style={styles.body}>

          {/* Left sidebar: chapter tabs */}
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
              {CHAPTER_DEFS.map(renderChTab)}
            </ScrollView>
          </View>

          {/* Right: chapter info + 3 part cards */}
          <View style={styles.content}>
            <View style={styles.chStrip}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chStripNum, { color: chColor }]}>CHAPTER {selectedChId}</Text>
                <Text style={styles.chStripTitle}>{selectedCh?.title}</Text>
                <Text style={styles.chStripSub}>{selectedCh?.subtitle}</Text>
              </View>
              {isChapterCompleted(selectedChId) && (
                <View style={styles.chDoneBadge}>
                  <Ionicons name="trophy" size={13} color={C.GOLD} />
                  <Text style={styles.chDoneTxt}>Chapter Complete</Text>
                </View>
              )}
            </View>

            <View style={[styles.accentLine, { backgroundColor: chColor + '60' }]} />

            <View style={styles.partsRow}>
              {stagesToShow.map(renderPartCard)}
            </View>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  hdrBack:      { padding: 4 },
  hdrTitle:     { fontSize: 18, fontWeight: '900', color: C.TEXT, letterSpacing: 3 },
  hdrSub:       { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  progressPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(217,119,6,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.GOLD },
  progressTxt:  { fontSize: 11, color: C.GOLD, fontWeight: '800' },

  body:    { flex: 1, flexDirection: 'row' },

  sidebar:      { width: SIDEBAR_W, borderRightWidth: 1, borderRightColor: C.BORDER },
  sidebarScroll:{ padding: 8, gap: 6 },
  chTab:        { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.BORDER },
  chTabGrad:    { padding: 10, position: 'relative' },
  chTabTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  chNumBadge:   { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chNum:        { fontSize: 11, fontWeight: '900' },
  chTabTitle:   { fontSize: 11, fontWeight: '800', color: C.TEXT, letterSpacing: 0.2 },
  chTabSub:     { fontSize: 9, color: C.TEXT_MUTED, marginTop: 2, lineHeight: 13 },
  chTabAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },

  content:   { flex: 1, padding: 12, gap: 8 },
  accentLine:{ height: 1, borderRadius: 1 },

  chStrip:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chStripNum:   { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  chStripTitle: { fontSize: 17, fontWeight: '900', color: C.TEXT, letterSpacing: 0.5 },
  chStripSub:   { fontSize: 11, color: C.TEXT_SOFT, marginTop: 2 },
  chDoneBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(217,119,6,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.GOLD },
  chDoneTxt:    { fontSize: 11, color: C.GOLD, fontWeight: '700' },

  partsRow: { flex: 1, flexDirection: 'row', gap: 10 },

  partCard:       { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  partCardDone:   { borderColor: 'rgba(5,150,105,0.4)' },
  partCardLocked: { opacity: 0.48 },
  partCardGrad:   { flex: 1, padding: 12 },

  partTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  partBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  partBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bossTag:      { backgroundColor: 'rgba(220,38,38,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.DANGER },
  bossTagTxt:   { fontSize: 8, color: C.DANGER, fontWeight: '900', letterSpacing: 1 },

  stageTitle: { fontSize: 14, fontWeight: '800', color: C.TEXT, marginBottom: 4, letterSpacing: 0.2 },
  stageDesc:  { fontSize: 10, color: C.TEXT_SOFT, lineHeight: 15, marginBottom: 8, flex: 1 },
  lockedTxt:  { color: C.TEXT_DISABLED },

  rewardRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  rewardGems: { fontSize: 11, color: C.GOLD, fontWeight: '700' },
  rewardIcon: { width: 14, height: 14 },

  enterBtn:      { borderRadius: 8, overflow: 'hidden' },
  enterBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 5 },
  enterBtnTxt:   { fontSize: 12, fontWeight: '800', color: C.TEXT, letterSpacing: 0.5 },
});
