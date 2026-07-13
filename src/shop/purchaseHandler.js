import useGameStore from '../store/gameStore';
import { IAP_ENABLED } from '../data/shopPacks';
import { purchase as rcPurchase } from '../utils/RevenueCatManager';

// Single seam between the Shop UI and payment logic.
//   currency:'gems' → spends in-game gems via the store
//   currency:'iap'  → triggers RevenueCat native purchase sheet
//
// The caller (ShopScreen) calls gameStore.grantShopPack(pack.id) only on ok:true.
export async function resolvePurchase(pack) {
  if (!pack) return { ok: false, reason: 'invalid' };

  if (pack.currency === 'gems') {
    const ok = useGameStore.getState().spendGems(pack.cost);
    return { ok, reason: ok ? undefined : 'gems' };
  }

  if (pack.currency === 'iap') {
    // Defensive backstop - the Shop UI hides IAP packs while IAP_ENABLED is
    // false, so this path is only reached when RevenueCat is fully configured.
    if (!IAP_ENABLED) return { ok: false, reason: 'unavailable' };
    return rcPurchase(pack.productId);
  }

  return { ok: false, reason: 'unknown' };
}
