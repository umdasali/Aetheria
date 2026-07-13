// ─── Shop pack catalog ─────────────────────────────────────────────────────
// Three categories surfaced on the Home → Shop screen:
//   • GEM_PACKS  - premium gems. currency:'iap' (real money), live via RevenueCat.
//   • BUNDLES    - gems + gold value packs. currency:'iap', live via RevenueCat.
//   • HERO_PACKS - the shop-exclusive Sovereign. currency:'gems' (playable now),
//                  repeatable (+1 copy each buy), grants bonus gold + Aetheria's Core.
//
// Payment is resolved by src/shop/purchaseHandler.js (gem-spend for currency:'gems',
// RevenueCat for currency:'iap'). The grant is applied atomically by
// gameStore.grantShopPack(), and also by gameStore.grantIapTransaction() for
// consumable purchases recovered via the CustomerInfo listener after an
// interrupted purchase (app killed mid-transaction, etc).
//
// NOTE: these `productId`s must exist as real, live products in App Store
// Connect / Play Console - RevenueCat can't sell a product the store doesn't know
// about. Confirm they're published before shipping with IAP_ENABLED = true.
//
// `grant` shape (all optional): { gems, gold, cores }  - `cores` = Aetheria's Core.
// `heroId` (top level) is the headline hero granted + previewed.
// `cost` is a NUMBER for currency:'gems', and `priceLabel` is the display string
// for currency:'iap' (real money handled by the store later via `productId`).

import { C } from '../theme/colors';

// ─── Real-money IAP master switch ──────────────────────────────────────────
// TRUE - RevenueCat is wired (src/utils/RevenueCatManager.js) and IAP packs are
// live in the Shop. While false: the GEMS and BUNDLES tabs are hidden and
// purchaseHandler refuses any `currency:'iap'` pack (never grants for free).
// The gem-priced EXCLUSIVE Sovereign pack is always playable regardless.
export const IAP_ENABLED = true;

const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');
const CHEST_IMG = require('../../assets/currency/chest.png');

export const GEM_PACKS = [
  { id: 'gems_handful', currency: 'iap', productId: 'aetheria_legends.unbound.gems_300',  priceLabel: '$1.99',  grant: { gems: 300 },  label: '300 Gems',   image: GEM_IMG,   color: C.PRIMARY_LIGHT },
  { id: 'gems_stack',   currency: 'iap', productId: 'aetheria_legends.unbound.gems_980',  priceLabel: '$4.99',  grant: { gems: 980 },  label: '980 Gems',   image: GEM_IMG,   color: C.PRIMARY, tag: 'POPULAR' },
  { id: 'gems_chest',   currency: 'iap', productId: 'aetheria_legends.unbound.gems_2100', priceLabel: '$9.99',  grant: { gems: 2100 }, label: '2,100 Gems', image: CHEST_IMG, color: C.SECONDARY, tag: 'BEST VALUE' },
  { id: 'gems_vault',   currency: 'iap', productId: 'aetheria_legends.unbound.gems_4500', priceLabel: '$19.99', grant: { gems: 4500 }, label: '4,500 Gems', image: CHEST_IMG, color: C.GOLD },
];

export const BUNDLES = [
  { id: 'starter_bundle',     currency: 'iap', productId: 'aetheria_legends.unbound.bundle_starter', priceLabel: '$2.99',  grant: { gems: 300,  gold: 30000 },  label: 'Starter Bundle',     sublabel: '300 Gems + 30,000 Gold',   image: GOLD_IMG, color: C.CYAN,    tag: 'STARTER' },
  { id: 'adventurer_bundle',  currency: 'iap', productId: 'aetheria_legends.unbound.bundle_adv',     priceLabel: '$9.99',  grant: { gems: 1200, gold: 100000 }, label: 'Adventurer Bundle',  sublabel: '1,200 Gems + 100,000 Gold', image: GOLD_IMG, color: C.GOLD,    tag: 'VALUE' },
];

export const HERO_PACKS = [
  {
    id: 'sovereign_nefertari',
    currency: 'gems',
    // Raised 2400 → 4000 (2026-07-05 audit): at 2400 the net cost per repeat
    // purchase (2400 spent − 500 gems granted back = 1900 net gems) for 50,000
    // gold + 3 cores + a guaranteed copy made this the cheapest gold source in
    // the game by a wide margin and farmable without limit. 4000 roughly
    // doubles the net gem cost while keeping the pack purchasable for players
    // who specifically want extra Sovereign copies.
    cost: 4000,
    repeatable: true,
    heroId: 'hero_054',
    grant: { gems: 500, gold: 50000, cores: 3 },
    label: 'Nefertari Shahrzad',
    sublabel: 'Shop-Exclusive Sovereign',
    tag: 'EXCLUSIVE',
    color: C.SOVEREIGN_GOLD,
  },
];

// Flat lookup for the store grant action.
const ALL_PACKS = [...GEM_PACKS, ...BUNDLES, ...HERO_PACKS];
const PACK_BY_ID = ALL_PACKS.reduce((m, p) => { m[p.id] = p; return m; }, {});
const PACK_BY_PRODUCT_ID = ALL_PACKS.reduce((m, p) => { if (p.productId) m[p.productId] = p; return m; }, {});

export const getShopPackById = (id) => PACK_BY_ID[id] || null;
// Reverse lookup for RevenueCat's CustomerInfo transactions, which are keyed by
// the platform product id rather than our internal pack id.
export const getShopPackByProductId = (productId) => PACK_BY_PRODUCT_ID[productId] || null;
