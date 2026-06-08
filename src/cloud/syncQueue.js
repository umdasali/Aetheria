import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadSave } from './cloudSave';

const SYNC_DELAY = 30_000;   // 30s debounce window
const MAX_DELAY  = 300_000;  // 5 min max retry delay
const LAST_SYNC_KEY = 'trump-card-game-last-sync';

let _timer      = null;
let _retryCount = 0;
let _getState   = null;

export function initSyncQueue(getStateFn) {
  _getState = getStateFn;
}

export function triggerSync() {
  if (!_getState) return;
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(_doSync, SYNC_DELAY);
}

async function _doSync() {
  _timer = null;
  if (!_getState) return;
  const result = await uploadSave(_getState());
  if (result.ok) {
    _retryCount = 0;
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } else {
    _retryCount++;
    const delay = Math.min(SYNC_DELAY * Math.pow(2, _retryCount), MAX_DELAY);
    _timer = setTimeout(_doSync, delay);
  }
}

export async function syncNow(getStateFn) {
  if (_timer) { clearTimeout(_timer); _timer = null; }
  const fn = getStateFn || _getState;
  if (!fn) return { ok: false, error: new Error('Store not initialised') };
  const result = await uploadSave(fn());
  if (result.ok) {
    _retryCount = 0;
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  }
  return result;
}

export async function getLastSyncTime() {
  const ts = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return ts ? parseInt(ts, 10) : null;
}
