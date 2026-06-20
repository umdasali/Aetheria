// Lightweight client-side profanity filter for user-authored text that becomes
// publicly visible (display name + signature → public leaderboard). This is the
// minimum bar App Store §1.2 / Google Play UGC policy expect: a filter on
// publicly-shown user text. It is intentionally simple — a blocklist with
// leetspeak normalisation — not a perfect moderation system.

// Base blocklist (kept short and obvious; expand as needed). Lowercase only.
const BLOCKLIST = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'dick',
  'piss', 'slut', 'whore', 'fag', 'nigger', 'nigga', 'retard',
  'rape', 'nazi', 'cock', 'pussy', 'twat', 'wank',
];

// Common character substitutions used to evade filters.
const LEET_MAP = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

// Normalise a token: lowercase, map leetspeak, strip non-letters so "f.u.c.k"
// and "f u c k" collapse toward "fuck".
function normalize(str) {
  return str
    .toLowerCase()
    .split('')
    .map((ch) => LEET_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z]/g, '');
}

// Returns true if the text contains a blocklisted term (after normalisation).
export function containsProfanity(text) {
  if (!text) return false;
  const flat = normalize(text);
  return BLOCKLIST.some((bad) => flat.includes(bad));
}

// Masks any blocklisted term found in the raw text with asterisks, preserving
// the original spacing/casing of the rest of the string. Falls back to a
// per-word scan so clean words are left untouched.
export function cleanText(text) {
  if (!text) return text;
  return text
    .split(/(\s+)/) // keep separators so spacing is preserved
    .map((token) => (containsProfanity(token) ? '*'.repeat(token.length) : token))
    .join('');
}
