import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ANDROID_KEY = Constants.expoConfig?.extra?.revenueCatAndroidKey ?? '';
const IOS_KEY     = Constants.expoConfig?.extra?.revenueCatIosKey ?? '';

let _ready = false;
let _customerInfoListener = null;

// Call once at app startup (App.js useEffect). Pass the Supabase userId if
// already signed in, otherwise pass null and call setUserId() after sign-in.
export async function configure(appUserID = null) {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  console.log('[RevenueCat] configure — key present:', !!apiKey, '| platform:', Platform.OS);
  if (!apiKey) {
    console.warn('[RevenueCat] No API key — IAP will not work');
    return;
  }
  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: appUserID ?? undefined });
    _ready = true;
    console.log('[RevenueCat] configured OK');
  } catch (e) {
    console.warn('[RevenueCat] configure failed:', e.message);
  }
}

// Call after the user signs into Supabase so purchases are linked to their account.
export async function setUserId(userId) {
  if (!_ready) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] logIn failed:', e.message);
  }
}

// Call when the user signs out.
export async function logOut() {
  if (!_ready) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] logOut failed:', e.message);
  }
}

// Packages actually being served to this customer right now. Prefers
// offerings.current — the Offering RevenueCat Targeting/experiments resolve
// for this specific customer — over flattening every offering together,
// which would make price/availability nondeterministic if the dashboard ever
// has two offerings sharing a product id (e.g. an experiment group). Falls
// back to every offering combined only when no current Offering is
// configured, so a dashboard mis-set doesn't take purchasing/pricing down.
async function getDisplayPackages(offerings) {
  const current = offerings.current?.availablePackages || [];
  if (current.length) return current;
  if (__DEV__ && offerings.current === null) {
    console.warn('[RevenueCat] no current Offering configured on the dashboard — falling back to all offerings combined');
  }
  return Object.values(offerings.all).flatMap(o => o.availablePackages);
}

// Finds the package matching productId in the live current Offering (see
// getDisplayPackages) and initiates the native purchase sheet.
export async function purchase(productId) {
  if (!_ready) return { ok: false, reason: 'not_configured' };
  try {
    const offerings = await Purchases.getOfferings();
    const packages = await getDisplayPackages(offerings);
    const pkg = packages.find(p => p.product.identifier === productId) || null;
    if (!pkg) return { ok: false, reason: 'product_not_found' };
    await Purchases.purchasePackage(pkg);
    return { ok: true };
  } catch (e) {
    if (e.userCancelled) return { ok: false, reason: 'cancelled' };
    if (__DEV__) console.warn('[RevenueCat] purchase failed:', e.message);
    return { ok: false, reason: 'iap_failed' };
  }
}

// Subscribes to CustomerInfo updates so a purchase that's charged but never
// reaches our success handler (app killed mid-transaction, network drop right
// after the charge, etc) still gets granted once RevenueCat replays it — the
// SDK re-delivers pending transactions on every relaunch/customerInfo refresh,
// but only to a listener, never by re-resolving the original purchase() promise.
// onCustomerInfo receives the raw CustomerInfo object; the caller is
// responsible for diffing customerInfo.nonSubscriptionTransactions against
// what it's already granted (see gameStore.grantIapTransaction).
export function startTransactionListener(onCustomerInfo) {
  if (!_ready) return () => {};
  stopTransactionListener();
  _customerInfoListener = (customerInfo) => {
    try { onCustomerInfo(customerInfo); } catch (e) {
      if (__DEV__) console.warn('[RevenueCat] transaction listener handler failed:', e.message);
    }
  };
  Purchases.addCustomerInfoUpdateListener(_customerInfoListener);
  return stopTransactionListener;
}

export function stopTransactionListener() {
  if (_customerInfoListener) {
    Purchases.removeCustomerInfoUpdateListener(_customerInfoListener);
    _customerInfoListener = null;
  }
}

// Returns { prices: { [productId]: localizedPriceString }, availableIds: Set<productId> | null }
// from the store's live current Offering (see getDisplayPackages).
//   - prices: Shop UI should prefer this over any hardcoded priceLabel — a
//     price baked into shopPacks.js can silently drift from what the platform
//     actually charges (currency, regional pricing, a price change in the store).
//   - availableIds: which productIds are actually live right now, in the
//     order RevenueCat is serving them. `null` means the check itself failed
//     (not configured/offline) — callers should fail OPEN (show every local
//     pack) in that case, since a network hiccup isn't evidence a product was
//     pulled. An empty-but-non-null Set is likewise treated as "couldn't
//     determine availability" by getDisplayPackages' own fallback, so in
//     practice this is only empty when nothing is configured anywhere on the
//     dashboard — callers should still fail open rather than show zero packs.
export async function getLiveCatalog() {
  if (!_ready) return { prices: {}, availableIds: null };
  try {
    const offerings = await Purchases.getOfferings();
    const packages = await getDisplayPackages(offerings);
    const prices = {};
    const availableIds = new Set();
    for (const p of packages) {
      prices[p.product.identifier] = p.product.priceString;
      availableIds.add(p.product.identifier);
    }
    return { prices, availableIds };
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] getLiveCatalog failed:', e.message);
    return { prices: {}, availableIds: null };
  }
}

// Restores past purchases — required by App Store / Play Store guidelines.
export async function restorePurchases() {
  if (!_ready) return { ok: false, reason: 'not_configured' };
  try {
    await Purchases.restorePurchases();
    return { ok: true };
  } catch (e) {
    if (__DEV__) console.warn('[RevenueCat] restore failed:', e.message);
    return { ok: false, reason: 'restore_failed' };
  }
}
