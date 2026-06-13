// ─── Pluggable purchase layer ──────────────────────────────────────────────
// Single seam between the Shop UI and "how payment happens", so the screen and
// the grant logic never need to know whether we're spending gems or charging
// real money. Swapping in RevenueCat later means changing ONLY the 'iap' branch.
//
//   resolvePurchase(pack) → Promise<{ ok, reason?, stub? }>
//     • currency:'gems' → spend in-game gems via the store (playable today)
//     • currency:'iap'  → DEV STUB: resolves ok instantly so the shop is fully
//                         testable without App Store / Play Console setup.
//
// When integrating RevenueCat (react-native-purchases):
//   import Purchases from 'react-native-purchases';
//   in the 'iap' branch:
//     try {
//       const offerings = await Purchases.getOfferings();
//       const pkg = /* find package by pack.productId */;
//       await Purchases.purchasePackage(pkg);
//       return { ok: true };
//     } catch (e) {
//       return { ok: false, reason: e.userCancelled ? 'cancelled' : 'iap_failed' };
//     }
// The caller (ShopScreen) then calls gameStore.grantShopPack(pack.id) on ok.

import useGameStore from '../store/gameStore';
import { IAP_ENABLED } from '../data/shopPacks';

export async function resolvePurchase(pack) {
  if (!pack) return { ok: false, reason: 'invalid' };

  if (pack.currency === 'gems') {
    const ok = useGameStore.getState().spendGems(pack.cost);
    return { ok, reason: ok ? undefined : 'gems' };
  }

  if (pack.currency === 'iap') {
    // Real-money IAP is OFF until RevenueCat + store billing are wired
    // (see the integration notes above). Refuse the purchase so paid packs
    // can NEVER be granted for free. The Shop also hides these tabs while
    // IAP_ENABLED is false, so this is a defensive backstop.
    if (!IAP_ENABLED) return { ok: false, reason: 'unavailable' };
    // TODO(IAP): RevenueCat purchase flow goes here, then `return { ok: true }`.
    return { ok: false, reason: 'unavailable' };
  }

  return { ok: false, reason: 'unknown' };
}
