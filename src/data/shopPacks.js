// ─── Shop pack catalog ─────────────────────────────────────────────────────
// Three categories surfaced on the Home → Shop screen:
//   • GEM_PACKS  — premium gems. currency:'iap' (real money). Dev-stubbed today.
//   • BUNDLES    — gems + gold value packs. currency:'iap'. Dev-stubbed today.
//   • HERO_PACKS — the shop-exclusive Sovereign. currency:'gems' (playable now),
//                  repeatable (+1 copy each buy), grants bonus gold + Aetheria's Core.
//
// Payment is resolved by src/shop/purchaseHandler.js (pluggable: gem-spend now,
// RevenueCat later). The grant is applied atomically by gameStore.grantShopPack().
//
// `grant` shape (all optional): { gems, gold, cores }  — `cores` = Aetheria's Core.
// `heroId` (top level) is the headline hero granted + previewed.
// `cost` is a NUMBER for currency:'gems', and `priceLabel` is the display string
// for currency:'iap' (real money handled by the store later via `productId`).

import { C } from '../theme/colors';

// ─── Real-money IAP master switch ──────────────────────────────────────────
// FALSE until a payment provider (RevenueCat) + store billing are set up.
// While false: the GEMS and BUNDLES tabs are hidden in the Shop and
// purchaseHandler refuses any `currency:'iap'` pack (never grants for free).
// The gem-priced EXCLUSIVE Sovereign pack stays fully playable.
// Flip to true only after IAP is wired and store products are live.
export const IAP_ENABLED = false;

const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');
const CHEST_IMG = require('../../assets/currency/chest.png');

export const GEM_PACKS = [
  { id: 'gems_handful', currency: 'iap', productId: 'com.trumpcard.game.gems_300',  priceLabel: '$1.99',  grant: { gems: 300 },  label: '300 Gems',   image: GEM_IMG,   color: C.PRIMARY_LIGHT },
  { id: 'gems_stack',   currency: 'iap', productId: 'com.trumpcard.game.gems_980',  priceLabel: '$4.99',  grant: { gems: 980 },  label: '980 Gems',   image: GEM_IMG,   color: C.PRIMARY, tag: 'POPULAR' },
  { id: 'gems_chest',   currency: 'iap', productId: 'com.trumpcard.game.gems_2100', priceLabel: '$9.99',  grant: { gems: 2100 }, label: '2,100 Gems', image: CHEST_IMG, color: C.SECONDARY, tag: 'BEST VALUE' },
  { id: 'gems_vault',   currency: 'iap', productId: 'com.trumpcard.game.gems_4500', priceLabel: '$19.99', grant: { gems: 4500 }, label: '4,500 Gems', image: CHEST_IMG, color: C.GOLD },
];

export const BUNDLES = [
  { id: 'starter_bundle',     currency: 'iap', productId: 'com.trumpcard.game.bundle_starter', priceLabel: '$2.99',  grant: { gems: 300,  gold: 30000 },  label: 'Starter Bundle',     sublabel: '300 Gems + 30,000 Gold',   image: GOLD_IMG, color: C.CYAN,    tag: 'STARTER' },
  { id: 'adventurer_bundle',  currency: 'iap', productId: 'com.trumpcard.game.bundle_adv',     priceLabel: '$9.99',  grant: { gems: 1200, gold: 100000 }, label: 'Adventurer Bundle',  sublabel: '1,200 Gems + 100,000 Gold', image: GOLD_IMG, color: C.GOLD,    tag: 'VALUE' },
];

export const HERO_PACKS = [
  {
    id: 'sovereign_nefara',
    currency: 'gems',
    cost: 2400,
    repeatable: true,
    heroId: 'hero_054',
    grant: { gems: 500, gold: 50000, cores: 3 },
    label: 'Nefara Khonsu',
    sublabel: 'Shop-Exclusive Sovereign',
    tag: 'EXCLUSIVE',
    color: C.SOVEREIGN_GOLD,
  },
];

// Flat lookup for the store grant action.
const ALL_PACKS = [...GEM_PACKS, ...BUNDLES, ...HERO_PACKS];
const PACK_BY_ID = ALL_PACKS.reduce((m, p) => { m[p.id] = p; return m; }, {});

export const getShopPackById = (id) => PACK_BY_ID[id] || null;
