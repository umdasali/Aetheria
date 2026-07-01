import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ANDROID_KEY = Constants.expoConfig?.extra?.revenueCatAndroidKey ?? '';
const IOS_KEY     = Constants.expoConfig?.extra?.revenueCatIosKey ?? '';

let _ready = false;

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

// Finds the package matching productId across all RevenueCat offerings and
// initiates the native purchase sheet.
export async function purchase(productId) {
  if (!_ready) return { ok: false, reason: 'not_configured' };
  try {
    const offerings = await Purchases.getOfferings();
    let pkg = null;
    for (const offering of Object.values(offerings.all)) {
      for (const p of offering.availablePackages) {
        if (p.product.identifier === productId) { pkg = p; break; }
      }
      if (pkg) break;
    }
    if (!pkg) return { ok: false, reason: 'product_not_found' };
    await Purchases.purchasePackage(pkg);
    return { ok: true };
  } catch (e) {
    if (e.userCancelled) return { ok: false, reason: 'cancelled' };
    if (__DEV__) console.warn('[RevenueCat] purchase failed:', e.message);
    return { ok: false, reason: 'iap_failed' };
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
