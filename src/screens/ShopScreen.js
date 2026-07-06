import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { GEM_PACKS, BUNDLES, HERO_PACKS, IAP_ENABLED } from '../data/shopPacks';
import { resolvePurchase } from '../shop/purchaseHandler';
import { isSignedIn } from '../cloud/auth';
import { restorePurchases, getLivePrices } from '../utils/RevenueCatManager';
import { getHeroById } from '../data/heroes';
import { getAscensionItemById } from '../data/ascensionItems';
import HeroCard from '../components/HeroCard';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');

const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');
const CORE_IMG = getAscensionItemById('aetheria_core')?.image;

const HEADER_H  = 52;
const SIDEBAR_W = 142;
const PAD       = 10;
const GAP       = 8;

const CONTENT_W = W - SIDEBAR_W;
const BODY_H    = H - HEADER_H;
const CARD_W    = Math.floor((CONTENT_W - PAD * 2 - GAP * 3) / 4);
const CARD_H    = BODY_H - PAD * 2 - 18 - GAP;   // minus section strip + gap

// ─── Currency pack card (gems / bundles — real-money, IAP) ─────────────────────
function PackCard({ pack, onBuy, purchasing, livePriceLabel }) {
  const accent = pack.color || C.PRIMARY;
  const imgH   = Math.round(CARD_H * 0.30);

  return (
    <View style={[pc.card, { borderColor: accent + '55', width: CARD_W }]}>
      <LinearGradient
        colors={[accent + '1C', C.BG_CARD, C.BG_CARD]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      {pack.tag && (
        <View style={[pc.tag, { backgroundColor: accent + '28', borderColor: accent + '70' }]}>
          <Text style={[pc.tagTxt, { color: accent }]}>{pack.tag}</Text>
        </View>
      )}

      <View style={pc.imgArea}>
        <View style={[pc.glowRing, {
          borderColor: accent + '35', backgroundColor: accent + '0E',
          width: imgH + 22, height: imgH + 22, borderRadius: imgH + 11,
        }]} />
        <Image source={pack.image} style={{ width: imgH, height: imgH }} resizeMode="contain" />
      </View>

      <Text style={[pc.amtLabel, { color: accent }]} numberOfLines={1}>{pack.label}</Text>
      {pack.sublabel
        ? <Text style={pc.subLabel} numberOfLines={2}>{pack.sublabel}</Text>
        : <Text style={pc.subLabel}> </Text>}

      <View style={[pc.divider, { backgroundColor: accent + '28' }]} />

      <TouchableOpacity
        style={[pc.buyBtn, purchasing && { opacity: 0.5 }]}
        onPress={purchasing ? undefined : () => { AudioManager.playButtonSFX(); onBuy(pack); }}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={C.GRAD_GOLD}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={pc.buyInner}
        >
          {/* Prefer the store's own live, localized price over the hardcoded
              fallback — a baked-in priceLabel can drift from what's actually
              charged (currency, region, a price change made in the store). */}
          <Text style={pc.buyTxt}>{livePriceLabel ?? pack.priceLabel}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const pc = StyleSheet.create({
  card: {
    borderRadius: 12, overflow: 'hidden', borderWidth: 1.5,
    backgroundColor: C.BG_CARD, alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 8, gap: 7, position: 'relative',
    height: '100%',
    shadowColor: C.SHADOW, shadowRadius: 10, shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  tag: {
    position: 'absolute', top: 6, right: 6,
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2.5, borderWidth: 1, zIndex: 2,
  },
  tagTxt:   { fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  imgArea:  { alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 6 },
  glowRing: { position: 'absolute', borderWidth: 1 },
  amtLabel: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  subLabel: { fontSize: 8, color: C.TEXT_MUTED, fontWeight: '700', textAlign: 'center', lineHeight: 11, minHeight: 22 },
  divider:  { width: '80%', height: 1, borderRadius: 1 },
  buyBtn:   { borderRadius: 8, overflow: 'hidden', width: '90%', marginTop: 'auto' },
  buyInner: { paddingVertical: 9, alignItems: 'center' },
  buyTxt:   { fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 0.5 },
});

// ─── Exclusive hero pack (featured, gem-priced) ────────────────────────────────
function HeroPackPanel({ pack, gems, ownedCount, onBuy, purchasing }) {
  const hero   = getHeroById(pack.heroId);
  const canBuy = gems >= pack.cost && !purchasing;

  const cardH = Math.min(BODY_H - PAD * 2 - 18 - GAP, 360);
  const cardW = Math.round(cardH * (220 / 320));
  const g     = pack.grant || {};

  return (
    <View style={hp.panel}>
      {/* Left — the card */}
      <View style={hp.cardCol}>
        {hero ? <HeroCard hero={hero} width={cardW} /> : null}
      </View>

      {/* Right — details + grant + buy */}
      <View style={hp.infoCol}>
        <View style={[hp.exTag, { borderColor: C.SOVEREIGN_GOLD + '88' }]}>
          <Ionicons name="sparkles" size={11} color={C.SOVEREIGN_GOLD} />
          <Text style={hp.exTagTxt}>SHOP-EXCLUSIVE SOVEREIGN</Text>
        </View>

        <Text style={hp.heroName} numberOfLines={1}>{hero?.name ?? pack.label}</Text>
        <Text style={hp.heroSub} numberOfLines={2}>
          The only way to claim her. Each purchase grants an extra copy toward fusion & transcendence.
        </Text>

        {ownedCount > 0 && (
          <Text style={hp.ownedTxt}>Purchased ×{ownedCount}</Text>
        )}

        {/* Grant breakdown */}
        <View style={hp.grantBox}>
          <Text style={hp.grantHead}>THIS PACK CONTAINS</Text>
          <View style={hp.grantRow}>
            <Ionicons name="person" size={13} color={C.SOVEREIGN_GOLD} />
            <Text style={hp.grantTxt}>{hero?.name ?? 'Hero'} — Sovereign hero (+1 copy)</Text>
          </View>
          {!!g.gems && (
            <View style={hp.grantRow}>
              <Image source={GEM_IMG} style={hp.grantIcon} resizeMode="contain" />
              <Text style={hp.grantTxt}>{g.gems.toLocaleString()} Gems</Text>
            </View>
          )}
          {!!g.gold && (
            <View style={hp.grantRow}>
              <Image source={GOLD_IMG} style={hp.grantIcon} resizeMode="contain" />
              <Text style={hp.grantTxt}>{g.gold.toLocaleString()} Gold</Text>
            </View>
          )}
          {!!g.cores && (
            <View style={hp.grantRow}>
              {CORE_IMG ? <Image source={CORE_IMG} style={hp.grantIcon} resizeMode="contain" />
                        : <Ionicons name="diamond" size={13} color={C.SOVEREIGN_GOLD} />}
              <Text style={hp.grantTxt}>{g.cores}× Aetheria's Core (Sovereign ascension)</Text>
            </View>
          )}
        </View>

        {/* Buy */}
        <TouchableOpacity
          style={[hp.buyBtn, !canBuy && { opacity: 0.45 }]}
          onPress={canBuy ? () => { AudioManager.playButtonSFX(); onBuy(pack); } : undefined}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={canBuy ? C.GRAD_GOLD : [C.BG_MID, C.BG_MID]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={hp.buyInner}
          >
            <Image source={GEM_IMG} style={[hp.buyGem, !canBuy && { opacity: 0.4 }]} resizeMode="contain" />
            <Text style={[hp.buyTxt, !canBuy && { color: C.TEXT_DISABLED }]}>
              {pack.cost.toLocaleString()}
            </Text>
            <Text style={[hp.buyTxtSub, !canBuy && { color: C.TEXT_DISABLED }]}>
              {gems >= pack.cost ? 'GET NOW' : 'NEED GEMS'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const hp = StyleSheet.create({
  panel:   { flex: 1, flexDirection: 'row', gap: 16, alignItems: 'center' },
  cardCol: { alignItems: 'center', justifyContent: 'center' },
  infoCol: { flex: 1, justifyContent: 'center', gap: 8 },

  exTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
    backgroundColor: C.SOVEREIGN_GLOW,
  },
  exTagTxt: { fontSize: 8, fontWeight: '900', color: C.SOVEREIGN_GOLD, letterSpacing: 1.5 },

  heroName: { fontSize: 22, fontWeight: '900', color: C.TEXT, letterSpacing: 1 },
  heroSub:  { fontSize: 11, color: C.TEXT_SOFT, lineHeight: 16, fontWeight: '600' },
  ownedTxt: { fontSize: 9, color: C.SUCCESS, fontWeight: '800' },

  grantBox: {
    borderRadius: 10, borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.BG_RAISED, padding: 10, gap: 6,
  },
  grantHead: { fontSize: 7, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2 },
  grantRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  grantIcon: { width: 14, height: 14 },
  grantTxt:  { fontSize: 11, color: C.TEXT, fontWeight: '700' },

  buyBtn:   { borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start', marginTop: 2 },
  buyInner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 11, paddingHorizontal: 22 },
  buyGem:   { width: 16, height: 16 },
  buyTxt:   { fontSize: 16, fontWeight: '900', color: C.TEXT, letterSpacing: 0.5 },
  buyTxtSub:{ fontSize: 9, fontWeight: '900', color: C.TEXT, letterSpacing: 1, marginLeft: 4 },
});

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function ShopScreen({ navigation }) {
  const gems          = useGameStore(s => s.gems);
  const gold          = useGameStore(s => s.gold);
  const shopPurchases = useGameStore(s => s.shopPurchases);
  const grantShopPack = useGameStore(s => s.grantShopPack);
  const [activeTab, setActiveTab] = useState(IAP_ENABLED ? 'gems' : 'exclusive');
  const purchasingRef = useRef(false);
  const [purchasing, setPurchasing] = useState(false);
  const [livePrices, setLivePrices] = useState({});

  useEffect(() => {
    if (!IAP_ENABLED) return;
    getLivePrices().then(setLivePrices);
  }, []);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg,  setToastMsg]  = useState('');
  const [toastIsOk, setToastIsOk] = useState(true);

  const showToast = (msg, ok = true) => {
    setToastMsg(msg);
    setToastIsOk(ok);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const successMsg = (pack) => {
    if (pack.heroId) return `${getHeroById(pack.heroId)?.name ?? 'Hero'} obtained!`;
    const g = pack.grant || {};
    if (g.gems && g.gold) return `${pack.label} received!`;
    if (g.gems) return `+${g.gems.toLocaleString()} Gems!`;
    if (g.gold) return `+${g.gold.toLocaleString()} Gold!`;
    return 'Purchase complete!';
  };

  const handleRestore = async () => {
    if (purchasingRef.current) return;
    purchasingRef.current = true;
    setPurchasing(true);
    try {
      const res = await restorePurchases();
      showToast(res.ok ? 'Purchases restored!' : 'Nothing to restore', res.ok);
    } finally {
      purchasingRef.current = false;
      setPurchasing(false);
    }
  };

  const handleBuy = async (pack) => {
    if (purchasingRef.current) return;
    // Real-money purchases require a registered account — a guest's uid/name
    // is never claimed server-side, so there's no identity to attach a
    // receipt/refund history to. Gem-cost packs (exclusive/hero packs) spend
    // in-game currency, not real money, so guests can still buy those.
    if (pack.currency === 'iap' && !isSignedIn()) {
      navigation.navigate('CloudAuth');
      return;
    }
    purchasingRef.current = true;
    setPurchasing(true);
    try {
      const res = await resolvePurchase(pack);
      if (res.ok) {
        grantShopPack(pack.id);
        AudioManager.playRewardClaimSFX();
        showToast(successMsg(pack), true);
      } else {
        if (res.reason === 'cancelled') {
          // User dismissed the billing sheet — no toast needed
        } else {
          const msg = res.reason === 'gems'           ? 'Not enough gems!'
            : res.reason === 'unavailable'            ? 'Coming soon — not yet available'
            : res.reason === 'not_configured'         ? 'Store not available right now'
            : res.reason === 'product_not_found'      ? 'Product unavailable — try again later'
            : 'Purchase failed. Please try again.';
          showToast(msg, false);
        }
      }
    } finally {
      purchasingRef.current = false;
      setPurchasing(false);
    }
  };

  const toastColor = toastIsOk ? C.SUCCESS : C.DANGER;

  // GEMS and BUNDLES are real-money (IAP) tabs — hidden until IAP_ENABLED.
  const ALL_TABS = [
    { key: 'gems',      label: 'GEMS',      icon: 'diamond-outline',  hint: 'Premium gems for summoning and the exclusive shop.', iap: true },
    { key: 'bundles',   label: 'BUNDLES',   icon: 'gift-outline',     hint: 'Best-value gem + gold packs for fast progress.', iap: true },
    { key: 'exclusive', label: 'EXCLUSIVE', icon: 'sparkles-outline', hint: 'A Sovereign found nowhere else — only here.' },
  ];
  const TABS = ALL_TABS.filter(t => IAP_ENABLED || !t.iap);
  const activeHint = TABS.find(t => t.key === activeTab)?.hint ?? '';
  const secTitle = activeTab === 'gems' ? 'GEM PACKS'
    : activeTab === 'bundles' ? 'VALUE BUNDLES'
    : 'EXCLUSIVE SOVEREIGN';

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ HEADER ══ */}
        <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
          <TouchableOpacity
            style={s.back}
            onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={C.TEXT} />
          </TouchableOpacity>

          <View style={s.headerMid}>
            <Text style={s.hTitle}>SHOP</Text>
            <Text style={s.hSub}>{IAP_ENABLED ? 'Gems, bundles & the exclusive Sovereign' : 'The exclusive Sovereign — more coming soon'}</Text>
          </View>

          <View style={s.balPill}>
            <Image source={GEM_IMG} style={s.balPillIcon} resizeMode="contain" />
            <Text style={s.balPillTxt}>{gems.toLocaleString()}</Text>
          </View>
          <View style={s.balPill}>
            <Image source={GOLD_IMG} style={s.balPillIcon} resizeMode="contain" />
            <Text style={[s.balPillTxt, { color: C.GOLD }]}>{gold.toLocaleString()}</Text>
          </View>
        </LinearGradient>

        {/* ══ BODY ══ */}
        <View style={s.body}>

          {/* ── Sidebar ── */}
          <View style={s.sidebar}>
            <View style={s.balCard}>
              <LinearGradient colors={[C.PRIMARY_GLOW, 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={s.balLabel}>GEMS</Text>
              <View style={s.balRow}>
                <Image source={GEM_IMG} style={s.balIcon} resizeMode="contain" />
                <Text style={s.balAmt}>{gems.toLocaleString()}</Text>
              </View>
              <Text style={s.balHint}>Premium currency</Text>
            </View>

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
                    <Ionicons name={tab.icon} size={13} color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED} />
                    <Text style={[s.tabTxt, active && { color: C.PRIMARY_LIGHT }]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.sideHint}>
              <View style={s.sideHintLine} />
              <Text style={s.sideHintTxt}>{activeHint}</Text>
              {IAP_ENABLED && (
                <TouchableOpacity
                  style={s.restoreBtn}
                  onPress={handleRestore}
                  activeOpacity={0.7}
                >
                  <Text style={s.restoreTxt}>Restore Purchases</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Content ── */}
          <View style={s.content}>
            <View style={s.secStrip}>
              <View style={s.secDot} />
              <Text style={s.secTitle}>{secTitle}</Text>
              <View style={s.secLine} />
            </View>

            {activeTab === 'exclusive' ? (
              HERO_PACKS.map(pack => (
                <HeroPackPanel
                  key={pack.id}
                  pack={pack}
                  gems={gems}
                  ownedCount={(shopPurchases || {})[pack.id] || 0}
                  onBuy={handleBuy}
                  purchasing={purchasing}
                />
              ))
            ) : (
              <View style={s.cardsRow}>
                {(activeTab === 'gems' ? GEM_PACKS : BUNDLES).map(pack => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                    onBuy={handleBuy}
                    purchasing={purchasing}
                    livePriceLabel={livePrices[pack.productId]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Toast ── */}
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

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    height: HEADER_H, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  back: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.GLASS_6,
  },
  headerMid: { flex: 1 },
  hTitle:    { fontSize: 15, fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  hSub:      { fontSize: 8, color: C.TEXT_ON_DARK_MUTED, marginTop: 1 },

  balPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '44', backgroundColor: C.PRIMARY_GLOW,
  },
  balPillIcon: { width: 14, height: 14 },
  balPillTxt:  { fontSize: 13, fontWeight: '900', color: C.PRIMARY_LIGHT },

  body: { flex: 1, flexDirection: 'row' },

  sidebar: {
    width: SIDEBAR_W, borderRightWidth: 1, borderRightColor: C.BORDER_SUBTLE,
    padding: PAD, gap: 10,
  },
  balCard: {
    borderRadius: 10, overflow: 'hidden', borderWidth: 1,
    borderColor: C.PRIMARY_LIGHT + '30', backgroundColor: C.BG_CARD, padding: 10, gap: 3,
  },
  balLabel: { fontSize: 7, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.5 },
  balRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balIcon:  { width: 19, height: 19 },
  balAmt:   { fontSize: 21, fontWeight: '900', color: C.PRIMARY_LIGHT },
  balHint:  { fontSize: 8, color: C.TEXT_DISABLED, fontWeight: '600' },

  tabGroup: { gap: 4 },
  tabBtn: {
    borderRadius: 8, overflow: 'hidden', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 10, gap: 7,
    borderWidth: 1, borderColor: 'transparent', position: 'relative',
  },
  tabBtnActive: { borderColor: C.PRIMARY + '40' },
  tabAccent: {
    position: 'absolute', left: 0, top: 6, bottom: 6,
    width: 2.5, borderRadius: 2, backgroundColor: C.PRIMARY_LIGHT,
  },
  tabTxt: { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 1 },

  sideHint:     { flex: 1, justifyContent: 'flex-end', paddingBottom: 4, gap: 7 },
  sideHintLine: { height: 1, backgroundColor: C.BORDER_SUBTLE },
  sideHintTxt:  { fontSize: 8, color: C.TEXT_DISABLED, fontWeight: '500', lineHeight: 13, fontStyle: 'italic' },
  restoreBtn:   { paddingVertical: 6, alignItems: 'center' },
  restoreTxt:   { fontSize: 8, color: C.TEXT_MUTED, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'underline' },

  content: { flex: 1, padding: PAD, gap: GAP },
  secStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 18 },
  secDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: C.PRIMARY_LIGHT },
  secTitle: { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.5 },
  secLine:  { flex: 1, height: 1, backgroundColor: C.BORDER_SUBTLE },

  cardsRow: { flex: 1, flexDirection: 'row', gap: GAP },

  toast: { position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' },
  toastInner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.BG_RAISED, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: C.SHADOW, shadowRadius: 6, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  toastTxt: { fontSize: 11, fontWeight: '800', color: C.TEXT },
});
