import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { ASCENSION_ITEMS } from '../data/ascensionItems';
import AudioManager from '../utils/AudioManager';
import { C, RANK } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');

const COIN_IMG = require('../../assets/currency/coin.png');
const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');

const HEADER_H  = 52;
const SIDEBAR_W = 142;
const PAD       = 10;
const GAP       = 8;

const CONTENT_W = W - SIDEBAR_W;
const BODY_H    = H - HEADER_H;
const CARD_W    = Math.floor((CONTENT_W - PAD * 2 - GAP * 3) / 4);
const CARD_H    = BODY_H - PAD * 2;
const ASC_IMG_H = Math.round(CARD_H * 0.37);
const BDL_IMG_H = Math.round(CARD_H * 0.28);

// ─── Currency bundles ─────────────────────────────────────────────────────────
// Gem pricing: a full weekly 1→200 climb yields ~5,425 coins. At ~2.5-3 coins
// per gem that caps shop gems at ~2,000/week — in line with quest/boss income.
// (The old 0.3 coins/gem rate made the tower worth ~17k gems/week and broke
// the gacha economy.)
const BUNDLES = [
  { id: 'gems_30',   type: 'gems', amount: 30,   cost: 90,  label: '30 Gems',    img: GEM_IMG,  color: C.PRIMARY_LIGHT },
  { id: 'gems_80',   type: 'gems', amount: 80,   cost: 200, label: '80 Gems',    img: GEM_IMG,  color: C.PRIMARY,       tag: 'VALUE' },
  { id: 'gold_500',  type: 'gold', amount: 500,  cost: 5,   label: '500 Gold',   img: GOLD_IMG, color: C.GOLD },
  { id: 'gold_1500', type: 'gold', amount: 1500, cost: 12,  label: '1,500 Gold', img: GOLD_IMG, color: C.GOLD,          tag: 'BEST' },
];

// ─── Ascension Item Card ──────────────────────────────────────────────────────
function AscCard({ item, coins, ownedCount, onBuy }) {
  const [qty, setQty] = useState(1);
  const r         = RANK[item.rankKey] || RANK.B;
  const totalCost = item.price * qty;
  const canBuy    = coins >= totalCost;

  return (
    <View style={[ac.card, { borderColor: r.glow + '60', width: CARD_W, height: "100%" }]}>
      <LinearGradient
        colors={[r.bg + '20', C.BG_CARD, C.BG_CARD]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Image area */}
      <View style={[ac.imgWrap, { height: ASC_IMG_H, borderBottomColor: r.glow + '38' }]}>
        <LinearGradient
          colors={[r.bg + '14', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <Image source={item.image} style={ac.img} resizeMode="contain" />

        {/* Rank badge — top right */}
        <View style={[ac.rankBadge, { backgroundColor: r.bg, borderColor: r.glow + 'AA' }]}>
          <Text style={[ac.rankTxt, { color: r.text }]}>{item.rankLabel}</Text>
        </View>

        {/* Owned count — top left, only if owned */}
        {ownedCount > 0 && (
          <View style={ac.ownedBadge}>
            <Text style={ac.ownedTxt}>×{ownedCount}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={ac.info}>
        <Text style={ac.name} numberOfLines={2}>{item.name}</Text>

        {/* For ranks tag */}
        <View style={[ac.forRankTag, { borderColor: r.glow + '50', backgroundColor: r.bg + '18' }]}>
          <Text style={[ac.forRankTxt, { color: r.glow }]}>{item.forRanks.join(' / ')} RANK</Text>
        </View>

        {/* Price per unit */}
        <View style={ac.priceRow}>
          <Image source={COIN_IMG} style={ac.coinIcon} resizeMode="contain" />
          <Text style={ac.priceVal}>{item.price.toLocaleString()}</Text>
          <Text style={ac.priceEa}>/ ea</Text>
        </View>

        {/* Qty stepper */}
        <View style={ac.qtyRow}>
          <TouchableOpacity
            style={[ac.qtyBtn, qty <= 1 && { opacity: 0.32 }]}
            onPress={() => { AudioManager.playButtonSFX(); setQty(q => Math.max(1, q - 1)); }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
          >
            <Text style={ac.qtyBtnTxt}>−</Text>
          </TouchableOpacity>
          <Text style={ac.qtyNum}>{qty}</Text>
          <TouchableOpacity
            style={ac.qtyBtn}
            onPress={() => { AudioManager.playButtonSFX(); setQty(q => Math.min(99, q + 1)); }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
          >
            <Text style={ac.qtyBtnTxt}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Buy button */}
        <TouchableOpacity
          style={[ac.buyBtn, !canBuy && { opacity: 0.40 }]}
          onPress={canBuy ? () => { AudioManager.playButtonSFX(); onBuy(item.id, qty); setQty(1); } : undefined}
          activeOpacity={0.82}
        >
          <LinearGradient
            colors={canBuy ? [r.bg, r.glow + 'BB'] : [C.BG_MID, C.BG_MID]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={ac.buyInner}
          >
            <Image
              source={COIN_IMG}
              style={[ac.buyCoinIcon, !canBuy && { opacity: 0.4 }]}
              resizeMode="contain"
            />
            <Text style={[ac.buyTxt, !canBuy && { color: C.TEXT_DISABLED }]}>
              {totalCost.toLocaleString()}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ac = StyleSheet.create({
  card: {
    borderRadius: 12, overflow: 'hidden', borderWidth: 1.5,
    backgroundColor: C.BG_CARD,
    shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  imgWrap: {
    width: '100%', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, overflow: 'hidden', position: 'relative',
  },
  img: { width: '78%', height: '86%' },

  rankBadge: {
    position: 'absolute', top: 5, right: 5,
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2.5, borderWidth: 1,
    shadowColor: '#000', shadowRadius: 3, shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  rankTxt: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },

  ownedBadge: {
    position: 'absolute', top: 5, left: 5,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
    backgroundColor: C.OVERLAY_3, borderWidth: 1, borderColor: C.BORDER_SUBTLE,
  },
  ownedTxt: { fontSize: 9, fontWeight: '900', color: C.SUCCESS },

  info:      { flex: 1, padding: 8, gap: 5, justifyContent: 'space-between' },
  name:      { fontSize: 10, fontWeight: '800', color: C.TEXT, lineHeight: 14 },

  forRankTag: {
    alignSelf: 'flex-start', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1,
  },
  forRankTxt: { fontSize: 7, fontWeight: '800', letterSpacing: 0.4 },

  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinIcon:   { width: 12, height: 12 },
  priceVal:   { fontSize: 12, fontWeight: '900', color: C.PRIMARY_LIGHT },
  priceEa:    { fontSize: 8, color: C.TEXT_MUTED, fontWeight: '700' },

  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.BG_MID, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnTxt:  { fontSize: 14, fontWeight: '900', color: C.TEXT_SOFT, lineHeight: 16 },
  qtyNum:     { fontSize: 13, fontWeight: '900', color: C.TEXT, minWidth: 20, textAlign: 'center' },

  buyBtn:     { borderRadius: 7, overflow: 'hidden' },
  buyInner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 5 },
  buyCoinIcon:{ width: 10, height: 10 },
  buyTxt:     { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
});

// ─── Bundle Card ──────────────────────────────────────────────────────────────
function BundleCard({ bundle, coins, onBuy }) {
  const canBuy = coins >= bundle.cost;

  return (
    <View style={[bc.card, { borderColor: bundle.color + '55', width: CARD_W, height: "100%" }]}>
      <LinearGradient
        colors={[bundle.color + '1C', C.BG_CARD, C.BG_CARD]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Value / Best tag */}
      {bundle.tag && (
        <View style={[bc.tag, { backgroundColor: bundle.color + '28', borderColor: bundle.color + '70' }]}>
          <Text style={[bc.tagTxt, { color: bundle.color }]}>{bundle.tag}</Text>
        </View>
      )}

      {/* Currency image with glow ring */}
      <View style={bc.imgArea}>
        <View style={[bc.glowRing, {
          borderColor: bundle.color + '35',
          backgroundColor: bundle.color + '0E',
          width: BDL_IMG_H + 22, height: BDL_IMG_H + 22,
          borderRadius: BDL_IMG_H + 11,
        }]} />
        <Image
          source={bundle.img}
          style={{ width: BDL_IMG_H, height: BDL_IMG_H }}
          resizeMode="contain"
        />
      </View>

      {/* Amount label */}
      <Text style={[bc.amtLabel, { color: bundle.color }]}>{bundle.label}</Text>

      {/* Price row */}
      <View style={bc.priceRow}>
        <Image source={COIN_IMG} style={bc.coinIcon} resizeMode="contain" />
        <Text style={[bc.priceVal, { color: C.PRIMARY_LIGHT }]}>{bundle.cost}</Text>
        <Text style={bc.priceUnit}>coins</Text>
      </View>

      {/* Divider */}
      <View style={[bc.divider, { backgroundColor: bundle.color + '28' }]} />

      {/* Exchange button */}
      <TouchableOpacity
        style={[bc.buyBtn, !canBuy && { opacity: 0.40 }]}
        onPress={canBuy ? () => { AudioManager.playButtonSFX(); onBuy(bundle); } : undefined}
        activeOpacity={0.82}
      >
        <LinearGradient
          colors={canBuy ? [C.PRIMARY_DARK, C.PRIMARY] : [C.BG_MID, C.BG_MID]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={bc.buyInner}
        >
          <Text style={[bc.buyTxt, !canBuy && { color: C.TEXT_DISABLED }]}>
            {canBuy ? 'EXCHANGE' : 'NO COINS'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const bc = StyleSheet.create({
  card: {
    borderRadius: 12, overflow: 'hidden', borderWidth: 1.5,
    backgroundColor: C.BG_CARD,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
    gap: 8, position: 'relative',
    shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  tag: {
    position: 'absolute', top: 6, right: 6,
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5, borderWidth: 1,
  },
  tagTxt:   { fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  imgArea:  { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glowRing: { position: 'absolute', borderWidth: 1 },
  amtLabel: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinIcon: { width: 13, height: 13 },
  priceVal: { fontSize: 14, fontWeight: '900' },
  priceUnit:{ fontSize: 9, color: C.TEXT_MUTED, fontWeight: '700' },
  divider:  { width: '80%', height: 1, borderRadius: 1 },
  buyBtn:   { borderRadius: 8, overflow: 'hidden', width: '88%' },
  buyInner: { paddingVertical: 8, alignItems: 'center' },
  buyTxt:   { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TowerShopScreen({ navigation }) {
  const towerCoins            = useGameStore(s => s.towerCoins);
  const ascensionInventory    = useGameStore(s => s.ascensionInventory);
  const purchaseAscensionItem = useGameStore(s => s.purchaseAscensionItem);
  const buyTowerBundle        = useGameStore(s => s.buyTowerBundle);
  const [activeTab, setActiveTab] = useState('asc');

  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg,  setToastMsg]  = useState('');
  const [toastIsOk, setToastIsOk] = useState(true);

  const showToast = (msg, ok = true) => {
    setToastMsg(msg);
    setToastIsOk(ok);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1100),
      Animated.timing(toastAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const handleBuyAscItem = (itemId, qty) => {
    const result = purchaseAscensionItem(itemId, qty);
    if (result.ok) {
      AudioManager.playRewardClaimSFX();
      showToast(`Purchased ×${qty}!`, true);
    } else {
      showToast(result.reason === 'coins' ? 'Not enough coins!' : 'Cannot buy', false);
    }
  };

  const handleBuyBundle = (bundle) => {
    const result = buyTowerBundle(bundle.type, bundle.amount, bundle.cost);
    if (result.ok) {
      AudioManager.playRewardClaimSFX();
      showToast(`+${bundle.label} received!`, true);
    } else {
      showToast('Not enough coins!', false);
    }
  };

  const inv        = ascensionInventory || {};
  const coins      = towerCoins || 0;
  const toastColor = toastIsOk ? C.SUCCESS : C.DANGER;

  const TABS = [
    { key: 'asc',     label: 'ASCENSION',  icon: 'flash-outline',    hint: 'Materials to ascend heroes beyond rank limits.' },
    { key: 'bundles', label: 'BUNDLES',     icon: 'pricetag-outline', hint: 'Convert coins into gems or gold for summoning.' },
  ];
  const activeHint = TABS.find(t => t.key === activeTab)?.hint ?? '';

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_TOWER} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
        <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
          <TouchableOpacity
            style={s.back}
            onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={C.TEXT} />
          </TouchableOpacity>

          <View style={s.headerMid}>
            <Text style={s.hTitle}>TOWER SHOP</Text>
            <Text style={s.hSub}>Exchange coins earned from clearing floors</Text>
          </View>

          <View style={s.coinPill}>
            <Image source={COIN_IMG} style={s.coinPillIcon} resizeMode="contain" />
            <Text style={s.coinTxt}>{coins.toLocaleString()}</Text>
            <Text style={s.coinLbl}>coins</Text>
          </View>
        </LinearGradient>

        {/* ══ BODY ═════════════════════════════════════════════════════════ */}
        <View style={s.body}>

          {/* ── Left Sidebar ──────────────────────────────────────────────── */}
          <View style={s.sidebar}>

            {/* Balance card */}
            <View style={s.balCard}>
              <LinearGradient
                colors={[C.PRIMARY_GLOW, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={s.balLabel}>BALANCE</Text>
              <View style={s.balRow}>
                <Image source={COIN_IMG} style={s.balIcon} resizeMode="contain" />
                <Text style={s.balAmt}>{coins.toLocaleString()}</Text>
              </View>
              <Text style={s.balHint}>Tower Coins</Text>
            </View>

            {/* Category tabs */}
            <View style={s.tabGroup}>
              {TABS.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[s.tabBtn, active && s.tabBtnActive]}
                    onPress={() => { AudioManager.playButtonSFX(); setActiveTab(tab.key); }}
                    activeOpacity={0.8}
                  >
                    {active && (
                      <LinearGradient
                        colors={[C.PRIMARY_DARK + '70', C.PRIMARY + '38']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    {active && <View style={s.tabAccent} />}
                    <Ionicons
                      name={tab.icon}
                      size={13}
                      color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED}
                    />
                    <Text style={[s.tabTxt, active && { color: C.PRIMARY_LIGHT }]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Flavor hint */}
            <View style={s.sideHint}>
              <View style={s.sideHintLine} />
              <Text style={s.sideHintTxt}>{activeHint}</Text>
            </View>

          </View>

          {/* ── Right Content ──────────────────────────────────────────────── */}
          <View style={s.content}>

            {/* Section heading strip */}
            <View style={s.secStrip}>
              <View style={s.secDot} />
              <Text style={s.secTitle}>
                {activeTab === 'asc' ? 'ASCENSION MATERIALS' : 'CURRENCY BUNDLES'}
              </Text>
              <View style={s.secLine} />
            </View>

            {/* Cards */}
            <View style={s.cardsRow}>
              {activeTab === 'asc'
                ? ASCENSION_ITEMS.map(item => (
                    <AscCard
                      key={item.id}
                      item={item}
                      coins={coins}
                      ownedCount={inv[item.id] || 0}
                      onBuy={handleBuyAscItem}
                    />
                  ))
                : BUNDLES.map(bundle => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      coins={coins}
                      onBuy={handleBuyBundle}
                    />
                  ))
              }
            </View>
          </View>

        </View>

        {/* ── Toast notification ─────────────────────────────────────────── */}
        <Animated.View
          pointerEvents="none"
          style={[s.toast, {
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }]}
        >
          <View style={[s.toastInner, { borderColor: toastColor + '55' }]}>
            <Ionicons name={toastIsOk ? 'checkmark-circle' : 'close-circle'} size={14} color={toastColor} />
            <Text style={s.toastTxt}>{toastMsg}</Text>
          </View>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // ── Header
  header: {
    height: HEADER_H,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  back: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.GLASS_6,
  },
  headerMid: { flex: 1 },
  hTitle:    { fontSize: 15, fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  hSub:      { fontSize: 8, color: C.TEXT_ON_DARK_MUTED, marginTop: 1 },

  coinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '44',
    backgroundColor: C.PRIMARY_GLOW,
  },
  coinPillIcon: { width: 14, height: 14 },
  coinTxt:      { fontSize: 14, fontWeight: '900', color: C.PRIMARY_LIGHT },
  coinLbl:      { fontSize: 8, color: C.TEXT_MUTED, fontWeight: '700' },

  // ── Body
  body: { flex: 1, flexDirection: 'row' },

  // ── Sidebar
  sidebar: {
    width: SIDEBAR_W,
    borderRightWidth: 1, borderRightColor: C.BORDER_SUBTLE,
    padding: PAD, gap: 10,
  },
  balCard: {
    borderRadius: 10, overflow: 'hidden', borderWidth: 1,
    borderColor: C.PRIMARY_LIGHT + '30',
    backgroundColor: C.BG_CARD,
    padding: 10, gap: 3,
  },
  balLabel: { fontSize: 7, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.5 },
  balRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balIcon:  { width: 19, height: 19 },
  balAmt:   { fontSize: 21, fontWeight: '900', color: C.PRIMARY_LIGHT },
  balHint:  { fontSize: 8, color: C.TEXT_DISABLED, fontWeight: '600' },

  tabGroup: { gap: 4 },
  tabBtn: {
    borderRadius: 8, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 10,
    gap: 7, borderWidth: 1, borderColor: 'transparent',
    position: 'relative',
  },
  tabBtnActive: { borderColor: C.PRIMARY + '40' },
  tabAccent: {
    position: 'absolute', left: 0, top: 6, bottom: 6,
    width: 2.5, borderRadius: 2, backgroundColor: C.PRIMARY_LIGHT,
  },
  tabTxt: { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 1 },

  sideHint:    { flex: 1, justifyContent: 'flex-end', paddingBottom: 4, gap: 7 },
  sideHintLine:{ height: 1, backgroundColor: C.BORDER_SUBTLE },
  sideHintTxt: { fontSize: 8, color: C.TEXT_DISABLED, fontWeight: '500', lineHeight: 13, fontStyle: 'italic' },

  // ── Content
  content: { flex: 1, padding: PAD, gap: GAP },

  secStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 18 },
  secDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: C.PRIMARY_LIGHT },
  secTitle: { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.5 },
  secLine:  { flex: 1, height: 1, backgroundColor: C.BORDER_SUBTLE },

  cardsRow: { flex: 1, flexDirection: 'row', gap: GAP },

  // ── Toast
  toast: {
    position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center',
  },
  toastInner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.BG_RAISED, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowRadius: 6, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  toastTxt: { fontSize: 11, fontWeight: '800', color: C.TEXT },
});
