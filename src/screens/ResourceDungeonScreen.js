import React, { useCallback, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions, Alert, Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../store/gameStore';
import {
  DUNGEON_DEFS, DAILY_DUNGEON_ATTEMPTS, DUNGEON_REFILL_COST, DUNGEON_REFILL_AMOUNT,
  getDungeonEnemyGroup, getDungeonReward, getDiffColor,
  MATERIAL_EXCHANGE_RECIPES,
} from '../data/resourceDungeons';
import { getAscensionItemById } from '../data/ascensionItems';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const GOLD_IMG = require('../../assets/currency/gold.png');
const GEM_IMG  = require('../../assets/currency/gem.png');

const HEADER_H     = 54;
const RAIL_W       = 130;
const FOOTER_MIN   = 48;
const PAD          = 12;
const INNER_PAD    = 10;

// ── Left rail: dungeon selector ───────────────────────────────────────────────
function DungeonRail({ dungeons, selectedIdx, onSelect }) {
  return (
    <View style={rail.wrap}>
      {dungeons.map((d, i) => {
        const active = i === selectedIdx;
        return (
          <TouchableOpacity
            key={d.id}
            style={[rail.btn, { borderColor: active ? d.accent : C.BORDER_SUBTLE }]}
            onPress={() => onSelect(i)}
            activeOpacity={0.8}
          >
            {active && (
              <LinearGradient
                colors={[d.accent + '28', d.accent + '08']}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Ionicons
              name={d.icon}
              size={22}
              color={active ? d.accent : C.TEXT_MUTED}
            />
            <Text
              style={[rail.name, { color: active ? d.accent : C.TEXT_MUTED }]}
              numberOfLines={2}
            >
              {d.name}
            </Text>
            {/* Active indicator bar on the right edge */}
            {active && <View style={[rail.activePip, { backgroundColor: d.accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const rail = StyleSheet.create({
  wrap: {
    width: RAIL_W,
    borderRightWidth: 1,
    borderRightColor: C.BORDER_SUBTLE,
    backgroundColor: C.BG_DEEP,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRightWidth: 3,
    borderRightColor: 'transparent',
    overflow: 'hidden',
  },
  name: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 13,
  },
  activePip: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 2,
  },
});

// ── Single tier card (tall) ───────────────────────────────────────────────────
function TierCard({ dungeon, tier, onEnter }) {
  const reward   = tier.reward;
  const material = reward.material ? getAscensionItemById(reward.material.itemId) : null;
  const diffCol  = getDiffColor(tier.diff);
  const stars    = [1, 2, 3].map(n => n <= tier.tier);

  return (
    <View style={[tc.card, { borderColor: dungeon.accent + '66' }]}>

      {/* ── ART ZONE ── */}
      <View style={tc.artZone}>
        <LinearGradient
          colors={[C.BG_RAISED, C.BG_CARD, C.BG_BOTTOM]}
          style={StyleSheet.absoluteFill}
        />
        {/* very faint diff wash — informational only */}
        <View style={[tc.artWash, { backgroundColor: diffCol + '0E' }]} />

        {/* faint watermark */}
        <Text style={[tc.watermark, { color: dungeon.accent + '12' }]}>{tier.label}</Text>

        {/* diff badge — top right, small */}
        <View style={[tc.artBadge, { backgroundColor: diffCol + '18', borderColor: diffCol + '55' }]}>
          <Text style={[tc.artBadgeTxt, { color: diffCol }]}>{tier.diff}</Text>
        </View>

        {/* item ring using dungeon accent, not diff color */}
        <View style={[tc.ring, { borderColor: dungeon.accent + '55' }]}>
          <View style={[tc.ringInner, { backgroundColor: dungeon.accent + '18' }]}>
            <Image
              source={material ? material.image : GOLD_IMG}
              style={tc.rewardImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* stars — dungeon accent when filled */}
        <View style={tc.starsBar}>
          {stars.map((on, i) => (
            <Text key={i} style={[tc.star, { color: on ? dungeon.accent : C.GLASS_5 }]}>★</Text>
          ))}
        </View>

        {/* corner brackets — dungeon accent */}
        <View style={[tc.cTL, { borderColor: dungeon.accent + 'AA' }]} />
        <View style={[tc.cTR, { borderColor: dungeon.accent + 'AA' }]} />
      </View>

      {/* ── SEPARATOR ── */}
      <View style={[tc.sep, { backgroundColor: dungeon.accent + '44' }]} />

      {/* ── INFO PANEL ── */}
      <View style={tc.infoPanel}>
        <LinearGradient colors={[C.BG_BOTTOM, C.BG_STATS]} style={StyleSheet.absoluteFill} />

        {/* bottom corner brackets */}
        <View style={[tc.cBL, { borderColor: dungeon.accent + '77' }]} />
        <View style={[tc.cBR, { borderColor: dungeon.accent + '77' }]} />

        {/* roman numeral + item name on one row */}
        <View style={tc.infoRow}>
          <Text style={[tc.roman, { color: dungeon.accent + 'BB' }]}>{tier.label}</Text>
          <Text style={tc.itemName} numberOfLines={1}>
            {material ? material.name : 'Gold'}
          </Text>
        </View>

        {/* reward quantity — accent colored */}
        <Text style={[tc.qty, { color: dungeon.accent }]}>
          {material ? `×${reward.material.qty}` : `${(reward.gold || 0).toLocaleString()}`}
        </Text>

        {/* bonus gold */}
        {material && reward.gold > 0 && (
          <View style={tc.bonusRow}>
            <Image source={GOLD_IMG} style={tc.bonusIcon} resizeMode="contain" />
            <Text style={tc.bonusGold}>+{(reward.gold || 0).toLocaleString()}</Text>
          </View>
        )}

        {/* power — muted, not accent */}
        <Text style={tc.powerTxt}>{tier.mult}× power</Text>
      </View>

      {/* ── DESCEND BUTTON — dark + accent outline, no saturated fill ── */}
      <TouchableOpacity
        style={[tc.btnWrap, { borderTopColor: dungeon.accent + '55' }]}
        onPress={() => onEnter(dungeon, tier)}
        activeOpacity={0.7}
      >
        <View style={tc.btn}>
          <Ionicons name="chevron-down-circle-outline" size={14} color={dungeon.accent} />
          <Text style={tc.btnTxt}>DESCEND</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const C_SZ = 11;
const C_W  = 2;

const tc = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'column',
    backgroundColor: C.BG_CARD,
  },

  // ── Art zone ──
  artZone: {
    flex: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artWash: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  watermark: {
    position: 'absolute',
    top: -10, right: 4,
    fontSize: 68,
    fontWeight: '900',
    lineHeight: 76,
  },
  artBadge: {
    position: 'absolute',
    top: 7, left: 7,
    borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  artBadgeTxt: { fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  ring: {
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  ringInner: {
    width: 66, height: 66,
    borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
  },
  rewardImg: { width: 50, height: 50 },
  starsBar: {
    position: 'absolute',
    bottom: 7,
    flexDirection: 'row',
    gap: 3,
  },
  star: { fontSize: 13, lineHeight: 16 },

  // ── Corner brackets ──
  cTL: { position: 'absolute', top: 5,    left: 5,   width: C_SZ, height: C_SZ, borderTopWidth:    C_W, borderLeftWidth:  C_W },
  cTR: { position: 'absolute', top: 5,    right: 5,  width: C_SZ, height: C_SZ, borderTopWidth:    C_W, borderRightWidth: C_W },
  cBL: { position: 'absolute', bottom: 5, left: 5,   width: C_SZ, height: C_SZ, borderBottomWidth: C_W, borderLeftWidth:  C_W },
  cBR: { position: 'absolute', bottom: 5, right: 5,  width: C_SZ, height: C_SZ, borderBottomWidth: C_W, borderRightWidth: C_W },

  sep: { height: 1 },

  // ── Info panel ──
  infoPanel: {
    flex: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 3,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  roman:   { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  itemName: { fontSize: 9, fontWeight: '700', color: C.TEXT_MUTED, flex: 1 },
  qty: { fontSize: 20, fontWeight: '900', lineHeight: 24 },

  bonusRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bonusIcon: { width: 10, height: 10 },
  bonusGold: { fontSize: 8, fontWeight: '800', color: C.GOLD },

  powerTxt: { fontSize: 7, fontWeight: '700', color: C.TEXT_DISABLED, letterSpacing: 0.5 },

  // ── Descend button ──
  btnWrap: {
    borderTopWidth: 1,
    backgroundColor: C.BG_BOTTOM,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  btnTxt: { fontSize: 10, fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
});

// ── Right panel: selected dungeon detail ──────────────────────────────────────
function DungeonDetail({ dungeon, onEnter }) {
  return (
    <View style={det.wrap}>
      {/* Dungeon background image */}
      {dungeon.image && (
        <Image source={dungeon.image} style={[StyleSheet.absoluteFill, { width: '100%', height: H }]} resizeMode="cover" />
      )}
      {/* Dark gradient overlay — keeps text readable over any image */}
      <LinearGradient
        colors={[C.SHADOW + '14', C.SHADOW + '9E', C.SHADOW + 'F0']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Identity: icon + name + lore */}
      <View style={det.identity}>
        <View style={[det.iconRing, { borderColor: dungeon.accent + '77', backgroundColor: dungeon.accent + '20' }]}>
          <Ionicons name={dungeon.icon} size={24} color={dungeon.accent} />
        </View>
        <View style={det.identityText}>
          <Text style={[det.name, { color: dungeon.accent }]}>
            {dungeon.name.toUpperCase()}
          </Text>
          <Text style={det.lore} numberOfLines={2}>{dungeon.lore}</Text>
        </View>
      </View>

      {/* Separator */}
      <View style={[det.sep, { backgroundColor: dungeon.accent + '55' }]} />

      {/* Tier cards */}
      <View style={det.tierRow}>
        {dungeon.tiers.map(tier => (
          <TierCard key={tier.tier} dungeon={dungeon} tier={tier} onEnter={onEnter} />
        ))}
      </View>
    </View>
  );
}

const det = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: INNER_PAD,
    gap: INNER_PAD,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityText: { flex: 1, gap: 4 },
  name: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  lore: {
    fontSize: 9,
    color: C.TEXT_ON_DARK,
    fontWeight: '600',
    lineHeight: 13,
  },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.50 },
  sep: { height: 1 },
  tierRow: {
    flex: 1,
    flexDirection: 'row',
    gap: INNER_PAD,
  },
});

// ── Material Exchange Modal ───────────────────────────────────────────────────
function ExchangeModal({ visible, inventory, onExchange, onClose }) {
  const inv = inventory || {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={em.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close exchange"
        />

        <View style={em.panel}>
          <LinearGradient colors={[C.BG_MID, C.BG_DEEP]} style={StyleSheet.absoluteFill} />
          <View style={[em.topAccent, { backgroundColor: C.PRIMARY_LIGHT + '66' }]} />

          {/* Header */}
          <View style={em.header}>
            <Ionicons name="swap-horizontal" size={18} color={C.PRIMARY_LIGHT} />
            <View style={{ flex: 1 }}>
              <Text style={em.title}>MATERIAL EXCHANGE</Text>
              <Text style={em.subtitle}>Convert surplus reagents into higher-tier materials</Text>
            </View>
            <TouchableOpacity
              style={em.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={C.TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <View style={em.divider} />

          {/* Recipe list — always visible; individual rows disable when qty insufficient */}
          <ScrollView
            style={em.recipeScroll}
            contentContainerStyle={em.recipeList}
            showsVerticalScrollIndicator={false}
          >
            {MATERIAL_EXCHANGE_RECIPES.map(recipe => {
              const fromItem = getAscensionItemById(recipe.from.itemId);
              const toItem   = getAscensionItemById(recipe.to.itemId);
              // Skip a recipe whose items can't be resolved rather than rendering
              // a broken row (blank name/image) with a live Convert button.
              if (!fromItem || !toItem) return null;
              const have     = inv[recipe.from.itemId] || 0;
              const canDo    = have >= recipe.from.qty;

              return (
                <View key={recipe.id} style={[em.recipe, { borderColor: canDo ? C.PRIMARY + '55' : C.BORDER_SUBTLE }]}>

                  {/* FROM side */}
                  <View style={em.side}>
                    <Image source={fromItem?.image} style={em.itemImg} resizeMode="contain" />
                    <Text style={em.itemName} numberOfLines={2}>{fromItem?.name}</Text>
                    <View style={[em.qtyBadge, { backgroundColor: (canDo ? C.SUCCESS : C.DANGER) + '22', borderColor: (canDo ? C.SUCCESS : C.DANGER) + '66' }]}>
                      <Text style={[em.qtyText, { color: canDo ? C.SUCCESS : C.DANGER }]}>
                        {have} / {recipe.from.qty}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <View style={em.arrowCol}>
                    <Ionicons name="arrow-forward-circle" size={28} color={canDo ? C.PRIMARY_LIGHT : C.TEXT_DISABLED} />
                  </View>

                  {/* TO side */}
                  <View style={em.side}>
                    <Image source={toItem?.image} style={em.itemImg} resizeMode="contain" />
                    <Text style={em.itemName} numberOfLines={2}>{toItem?.name}</Text>
                    <View style={[em.qtyBadge, { backgroundColor: C.GOLD + '22', borderColor: C.GOLD + '66' }]}>
                      <Text style={[em.qtyText, { color: C.GOLD }]}>×{recipe.to.qty}</Text>
                    </View>
                  </View>

                  {/* Convert button */}
                  <TouchableOpacity
                    style={[em.convertBtn, { opacity: canDo ? 1 : 0.35 }]}
                    disabled={!canDo}
                    onPress={() => onExchange(recipe)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canDo }}
                    accessibilityLabel={`Convert: ${recipe.label}`}
                  >
                    <LinearGradient
                      colors={[C.PRIMARY, C.PRIMARY_DARK]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={em.convertInner}
                    >
                      <Ionicons name="swap-horizontal" size={13} color={C.TEXT} />
                      <Text style={em.convertTxt}>CONVERT</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: C.OVERLAY_4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    width: W * 0.68,
    maxHeight: H * 0.78,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.PRIMARY_LIGHT + '44',
  },
  topAccent: { height: 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  title:    { fontSize: 14, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 2.5 },
  subtitle: { fontSize: 8.5, color: C.TEXT_MUTED, fontWeight: '600', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.GLASS_6,
  },
  divider: { height: 1, backgroundColor: C.BORDER_SUBTLE, marginHorizontal: 18 },

  // flexShrink (not flex:1): the panel is content-sized with only a maxHeight, so
  // flex:1 would resolve flexBasis:0 and collapse the list to zero height. flexShrink
  // keeps the content height yet still shrinks-and-scrolls when it exceeds maxHeight.
  recipeScroll: { flexShrink: 1 },
  recipeList: { padding: 16, gap: 10 },
  recipe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.OVERLAY_2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },

  side: { flex: 1, alignItems: 'center', gap: 6 },
  itemImg:  { width: 52, height: 52 },
  itemName: { fontSize: 9, fontWeight: '700', color: C.TEXT, textAlign: 'center', lineHeight: 12 },
  qtyBadge: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  qtyText: { fontSize: 10, fontWeight: '900' },

  arrowCol: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },

  convertBtn:   { borderRadius: 10, overflow: 'hidden', alignSelf: 'center' },
  convertInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11,
  },
  convertTxt: { fontSize: 10, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },

});

// ── Exchange strip (footer button that opens the modal) ───────────────────────
function ExchangeStrip({ inventory, onOpen }) {
  const inv = inventory || {};
  const previewItems = MATERIAL_EXCHANGE_RECIPES
    .map(r => ({ item: getAscensionItemById(r.from.itemId), qty: inv[r.from.itemId] || 0 }))
    .filter(x => x.qty > 0)
    .slice(0, 3);

  return (
    <TouchableOpacity style={ef.strip} onPress={onOpen} activeOpacity={0.85}>
      <LinearGradient colors={[C.BG_MID, C.BG_DEEP]} style={StyleSheet.absoluteFill} />
      <View style={[ef.topBorder, { backgroundColor: C.PRIMARY_LIGHT + '55' }]} />

      <View style={ef.inner}>
        <Ionicons name="swap-horizontal" size={14} color={C.PRIMARY_LIGHT} />
        <Text style={ef.title}>MATERIAL EXCHANGE</Text>
        {previewItems.length > 0
          ? previewItems.map((x, i) => (
              <View key={i} style={ef.chip}>
                <Image source={x.item?.image} style={ef.chipImg} resizeMode="contain" />
                <Text style={ef.chipQty}>×{x.qty}</Text>
              </View>
            ))
          : <Text style={ef.hint}>Tap to convert surplus materials</Text>}
      </View>

      <View style={ef.openBtn}>
        <Ionicons name="open-outline" size={13} color={C.PRIMARY_LIGHT} />
        <Text style={ef.openTxt}>OPEN</Text>
      </View>
    </TouchableOpacity>
  );
}

const ef = StyleSheet.create({
  strip: {
    height: FOOTER_MIN,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
  },
  topBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  title: { fontSize: 10, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 2 },
  hint:  { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: C.OVERLAY_2, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.BORDER_SUBTLE,
  },
  chipImg: { width: 14, height: 14 },
  chipQty: { fontSize: 9, fontWeight: '800', color: C.TEXT },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: C.PRIMARY_GLOW, borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '55',
  },
  openTxt: { fontSize: 9, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 1 },
});

// ── Attempts HUD (header right side) ─────────────────────────────────────────
function AttemptsHud({ attemptsLeft, total, onRefill }) {
  const col    = attemptsLeft > 0 ? C.SUCCESS : C.DANGER;
  const isFull = attemptsLeft >= total;
  return (
    <View style={hud.wrap}>
      <View style={[hud.pill, { borderColor: col + '66' }]}>
        <Ionicons name="flash" size={12} color={col} />
        <Text style={[hud.count, { color: col }]}>{attemptsLeft}</Text>
        <Text style={hud.total}>/ {total}</Text>
      </View>
      <TouchableOpacity
        style={[hud.refill, isFull && hud.refillFull]}
        onPress={onRefill}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={11} color={isFull ? C.TEXT_DISABLED : C.PRIMARY_LIGHT} />
        <Image source={GEM_IMG} style={[hud.gemImg, isFull && { opacity: 0.4 }]} resizeMode="contain" />
        <Text style={[hud.refillTxt, isFull && { color: C.TEXT_DISABLED }]}>{DUNGEON_REFILL_COST}</Text>
      </TouchableOpacity>
    </View>
  );
}

const hud = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, backgroundColor: C.OVERLAY_2,
  },
  count: { fontSize: 14, fontWeight: '900' },
  total: { fontSize: 10, color: C.TEXT_MUTED, fontWeight: '700' },
  refill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '55', backgroundColor: C.PRIMARY_GLOW,
  },
  refillFull: {
    borderColor: C.BORDER_SUBTLE, backgroundColor: C.GLASS_3, opacity: 0.55,
  },
  gemImg:    { width: 13, height: 13 },
  refillTxt: { fontSize: 11, fontWeight: '900', color: C.PRIMARY_LIGHT },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ResourceDungeonScreen({ navigation }) {
  const team                   = useGameStore(s => s.team);
  const dungeonAttemptsUsed    = useGameStore(s => s.dungeonAttemptsUsed);
  const ascensionInventory     = useGameStore(s => s.ascensionInventory);
  const checkDungeonReset      = useGameStore(s => s.checkDungeonReset);
  const useDungeonAttempt      = useGameStore(s => s.useDungeonAttempt);
  const refillDungeonAttempts  = useGameStore(s => s.refillDungeonAttempts);
  const exchangeAscensionItems = useGameStore(s => s.exchangeAscensionItems);

  const [selectedIdx, setSelectedIdx]       = useState(0);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [, tick] = useState(0);
  // Debounce guard so a rapid double-tap can't convert twice in one burst.
  const exchangingRef = useRef(false);
  useFocusEffect(useCallback(() => {
    checkDungeonReset();
    tick(n => n + 1);
  }, [checkDungeonReset]));

  const dungeon      = DUNGEON_DEFS[selectedIdx];
  const attemptsLeft = Math.max(0, DAILY_DUNGEON_ATTEMPTS - (dungeonAttemptsUsed || 0));

  const handleEnter = (d, tier) => {
    if (!team || team.length === 0) {
      Alert.alert('No Team', 'Set your team before entering a dungeon.', [{ text: 'OK' }]);
      return;
    }
    if (!useDungeonAttempt()) {
      Alert.alert(
        'No Runs Left',
        `All ${DAILY_DUNGEON_ATTEMPTS} daily runs used.\nSpend ${DUNGEON_REFILL_COST} gems for 3 more, or return tomorrow.`,
        [{ text: 'OK' }],
      );
      return;
    }
    AudioManager.playButtonSFX();
    navigation.navigate('Battle', {
      chapterEnemies: getDungeonEnemyGroup(d.id, tier.tier),
      chapterId:      null,
      chapterRewards: { gems: 0, heroId: null },
      fromStory:      false,
      practiceMode:   false,
      dungeonMode:    true,
      dungeonId:      d.id,
      dungeonTier:    tier.tier,
      dungeonRewards: getDungeonReward(d.id, tier.tier),
    });
  };

  const handleRefill = () => {
    AudioManager.playButtonSFX();

    // Guard: energy already full
    if (attemptsLeft >= DAILY_DUNGEON_ATTEMPTS) {
      Alert.alert('Energy Full', 'You already have maximum energy!', [{ text: 'OK' }]);
      return;
    }

    // How many runs the player will actually gain (capped by used slots)
    const usedToday   = DAILY_DUNGEON_ATTEMPTS - attemptsLeft;
    const willRestore = Math.min(DUNGEON_REFILL_AMOUNT, usedToday);

    Alert.alert(
      'Refill Energy',
      `Spend ${DUNGEON_REFILL_COST} gems to restore ${willRestore} run${willRestore !== 1 ? 's' : ''}?\n\nCurrent energy: ${attemptsLeft} / ${DAILY_DUNGEON_ATTEMPTS}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Spend ${DUNGEON_REFILL_COST} Gems`,
          onPress: () => {
            if (!refillDungeonAttempts()) {
              Alert.alert('Not Enough Gems', `You need ${DUNGEON_REFILL_COST} gems to refill.`, [{ text: 'OK' }]);
            } else {
              AudioManager.playRewardClaimSFX();
              tick(n => n + 1);
            }
          },
        },
      ],
    );
  };

  const handleExchange = (recipe) => {
    // Debounce: a rapid double-tap must not silently convert twice (the top recipe
    // burns 5 scarce Feathers per run). The ref flips synchronously so a second tap
    // in the same burst is ignored; it clears after a short beat.
    if (exchangingRef.current) return;
    exchangingRef.current = true;
    // The Convert button is disabled when unaffordable and the store re-validates
    // before mutating; the ascensionInventory selector re-renders us on success.
    const ok = exchangeAscensionItems(
      recipe.from.itemId, recipe.from.qty,
      recipe.to.itemId,   recipe.to.qty,
    );
    if (ok) AudioManager.playRewardClaimSFX();
    setTimeout(() => { exchangingRef.current = false; }, 280);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.back}
            onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Home'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={C.TEXT} />
          </TouchableOpacity>

          <View style={s.headerText}>
            <Text style={s.hTitle}>DUNGEONS</Text>
            <Text style={s.hSub}>Daily gold · materials · ascension</Text>
          </View>

          <AttemptsHud
            attemptsLeft={attemptsLeft}
            total={DAILY_DUNGEON_ATTEMPTS}
            onRefill={handleRefill}
          />
        </View>

        {/* ── BODY: rail + detail ── */}
        <View style={s.body}>
          <DungeonRail
            dungeons={DUNGEON_DEFS}
            selectedIdx={selectedIdx}
            onSelect={i => { AudioManager.playButtonSFX(); setSelectedIdx(i); }}
          />
          <DungeonDetail dungeon={dungeon} onEnter={handleEnter} />
        </View>

        {/* ── EXCHANGE STRIP + MODAL ── */}
        <ExchangeStrip
          inventory={ascensionInventory}
          onOpen={() => { AudioManager.playButtonSFX(); setExchangeModalOpen(true); }}
        />
        <ExchangeModal
          visible={exchangeModalOpen}
          inventory={ascensionInventory}
          onExchange={handleExchange}
          onClose={() => setExchangeModalOpen(false)}
        />

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER_SUBTLE,
  },
  back: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.GLASS_6,
  },
  headerText: { flex: 1 },
  hTitle: { fontSize: 16, fontWeight: '900', color: C.TEXT, letterSpacing: 3 },
  hSub:   { fontSize: 8, color: C.TEXT_ON_DARK_MUTED, marginTop: 1 },

  body: {
    flex: 1,
    flexDirection: 'row',
  },
});
