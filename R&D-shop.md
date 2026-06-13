# R&D — Home Shop, HeroDetailScreen & Aetheria's Core

> Research-only document. No source files were modified in producing this.
> Date: 2026-06-13 · Project: Aetheria: Legends Unbound (Expo 56, RN 0.85.3)

## TL;DR — the three asks are one interlocking feature

The shop's "exclusive hero" wants to be a **Sovereign**; Sovereigns ascend with **Aetheria's Core**; Aetheria's Core **already exists** but has a routing bug that makes it impossible to spend on a Sovereign today. Fixing that one bug is what makes the whole shop feature coherent. Build order is at the bottom.

---

## Part 1 — `src/screens/HeroDetailScreen.js`

### Reality vs. the docs
The screen has grown past what `CLAUDE.md` documents. **Actual render order** (right scroll column):

`name → faction accent strip → tag chips → about → stats (with ▲ boost arrows) → stat-diff panel → Level Up → POWER FORGE (fusion + transcend) → ASCENSION → Convert Excess Copies → skills → trump → team toggle → share`

Ascension and Convert-Copies are **entirely undocumented**, and Level-Up / Power Forge now sit **above** skills/trump, not below. There's also a "Power Forge" full-screen burst animation overlay (expanding rings + badge) fired on rank-up / transcend / ascend, driven by `triggerForgeAnimation()` (all `useNativeDriver: true`).

### Layout notes
- Landscape split: left `cardCol` (HeroCard + floating back button, also the screenshot capture target via `cardRef`), right `infoCol` ScrollView.
- Card width derivation subtracts safe-area insets (better than the docs formula): `CARD_W = floor((H - topInset - bottomInset - 28) * (220/320))`.
- Tokens used consistently (`C.*`, `FACTIONS[].color`, `RANK_COLORS[]`). Typography matches the project scale.

### Business logic (verified against `src/store/gameStore.js`)

| Action | Cost | Rule |
|---|---|---|
| Level Up | `level≤10 ? 100×level : 200×(level−10)+1000` gold | cap = `10 + transcendence×5` (10→30) |
| Fusion | 3 copies + `[2000, 5000, 10000]` gold | `C→B→A→S`; **S is the hard cap** |
| Transcendence | 5 copies + `[8000, 15000, 25000, 40000]` gold | +5 cap each, max 4 (→ L30) |
| Ascension | **1 rank-gated material, no gold** | tiers 0→3, +0 / +15 / +30 / +50% all stats |
| Convert copies | — | 100 gold per copy |

Battle stat multiply (BattleScreen `buildPlayers`): `levelMult (×1.08/lvl) × rankMult (C 1.0 → SOV 1.85) × ascMult (1.0→1.5)`.

Reads: `ownedHeroes`, `team`, `gold`, `ascensionInventory`, `getHeroData`, `getEffectiveRank`.
Writes via: `levelUpHero`, `fuseHero`, `transcendHero`, `ascendHero`, `addToTeam`, `convertExcessCopies`, `trackQuestProgress`.

### Bugs & gaps

- **🔴 B1 — Sovereign heroes ascend with the WRONG material.** Item selection uses `effectiveRankKey`, which is `'S'` for a Sovereign (their base rank), so the game asks for **Feathers of Hope (S)**, never **Aetheria's Core**. `hero.sovereign` is used only for the badge, never for item routing. (Same bug surfaces in Part 2.) Fix:
  ```js
  const rankForItem = hero.sovereign ? 'SOVEREIGN' : (data.effectiveRank || hero.rank);
  const itemId = RANK_TO_ASCENSION_ITEM_ID[rankForItem];
  ```
  Locations: `gameStore.js:576-577` (`ascendHero`) and `HeroDetailScreen.js:160` (`ascItemId`).
- **🟠 B3 — `convertExcessCopies` never calls `triggerSync()`** (`gameStore.js:726-740`). Every other mutation does, so converting copies won't cloud-sync until the next action.
- **🟠 B8 — Power Forge section hidden when you can't yet fuse/transcend** (`canFuse || canTranscend`, `:350`). A new hero with <3 copies sees no "collect copies to fuse" affordance — inconsistent with Ascension, which always shows its requirement card.
- **🟡 B4 — Convert-Copies offers *all* copies** with no reservation for an imminent fusion (3) / transcend (5); only an Alert as friction.
- **🟡 B5 — Dead `downloadBtn` style** (`:889-903`, never referenced).
- **🟡 B6 — Bare-hex `shadowColor:'#000'`** on `backBtn` (`:881`) and `downloadBtn` (`:898`) — violates the no-raw-hex rule (AGENTS.md).
- **🟡 B7 — Share failures silently swallowed** (`handleDownload` `catch(_){}`, `:107`); no user feedback on capture/share error.
- **🟡 B2 — Inconsistent hero-collection shape:** `getHeroData` default omits `ascension`/`transcendence`; the four seeded `heroCollection` entries in `INITIAL_STATE` lack `ascension` (masked by `?? 0` reads).

---

## Part 2 — Aetheria's Core

### Verdict: it ALREADY EXISTS and is fully wired (not a concept to build)

Defined in `src/data/ascensionItems.js`:
- `aetheria_core` — "Aetheria's Core", `rankKey: 'SOVEREIGN'`, `forRanks: ['SOVEREIGN']`, `price: 800` (tower coins), real asset `assets/Character-Ascension/aetheria-core.png` (present on disk).
- Siblings: `feather_of_hope` (S, 500), `lost_butterfly` (A, 300), `broken_wing` (B/C, 150).

Ascension model:
- `ASCENSION_STAT_MULT = [1.0, 1.15, 1.30, 1.50]`, `ASCENSION_MAX = 3` (4 tiers 0..3).
- `RANK_TO_ASCENSION_ITEM_ID = { SOVEREIGN: aetheria_core, S: feather_of_hope, A: lost_butterfly, B: broken_wing, C: broken_wing }`.
- State: `ascensionInventory: { aetheria_core, feather_of_hope, lost_butterfly, broken_wing }` (all 0 at start); per-hero `ascension` field in `heroCollection`. Cloud-synced (max-merge), migrated (v1→v2), clamped (0–3 / 0–9999).
- Earn: `pickAscensionDrop()` from Tower boss floors (`completeTowerFloor`) and story milestones — **`aetheria_core` is deliberately excluded from drop pools** ("too rare to drop freely"). Buy: `purchaseAscensionItem(itemId, qty)` (tower coins). Spend: `ascendHero` consumes exactly 1 matching item.
- UI: Tower Shop ascension tab renders all four (incl. Aetheria's Core @ 800 coins); HeroDetailScreen ascension section; Victory/Home show drops.

### The critical gap

`ascendHero` resolves the required item by `data.effectiveRank || hero.rank`. Sovereigns have `rank: 'S'` + a separate `sovereign: true` flag, and **fusion caps at `'S'`** (`RANK_ORDER = ['C','B','A','S']`) — so **nothing ever sets a hero's rank to `'SOVEREIGN'`**. The `SOVEREIGN → aetheria_core` mapping is therefore **unreachable**: the Core can be bought and stockpiled but never spent. Routing on `hero.sovereign` (see B1 fix) makes it real and simultaneously fixes ascension for the existing 5 Sovereigns.

Key refs: `ascensionItems.js` (full catalog), `gameStore.js:35-51, 79-84, 411-444, 553-593`, `BattleScreen.js:133-153`, `TowerShopScreen.js:44-140`, `HeroDetailScreen.js:125-163`.

---

## Part 3 — Home Shop (design)

### The decision that gates everything: real money or not?

The game has **zero IAP** — no `expo-in-app-purchases`, RevenueCat, StoreKit, or billing config anywhere (`package.json` / `app.json` / `src/` all clean). All current "purchases" are in-game tower-coin exchanges. But "buy gems" only makes sense as a **real-money** purchase. Options:

- **Option A — Real-money shop (the genuine version).** Integrate `expo-in-app-purchases`/RevenueCat **and** configure products in App Store Connect + Play Console. Real project, store-approval lead time — not a same-day build.
- **Option B — Build now behind a pluggable purchase layer (recommended structure).** Build the full Shop UI + grant logic now; put the "pay" step behind a single `purchaseHandler` that grants instantly in dev. Everything testable today; swap in real IAP later without touching UI or rewards.
- **Option C — Gem-priced exclusive hero (recommended immediate slice).** Gem/gold *bundles* still need real money (A/B). But the **exclusive hero pack can cost gems** (in-game) — a "save up your gems" premium hero, fully functional with no IAP.

**Recommendation:** B for structure + C for the playable slice — make the exclusive hero pack gem-priced and shippable today; stub the gem/gold bundles behind the pluggable handler for IAP later.

### What needs to be built

1. **`ShopScreen`** — clone `TowerShopScreen.js` (tabbed sidebar, per-card affordability gating, immediate purchase + toast, no confirm modal). Tabs: **Gems / Bundles / Exclusive**. Register a `Shop` route in `App.js` (`animation: 'fade'`).
2. **Entry point — already waiting.** HUD `CurrencyChip` (`HomeScreen.js:549-565`) renders a `+` button with `accessibilityLabel="Add currency"` but **no `onPress`**. Wire it to `navigation.navigate('Shop')`. (Secondary: a `storefront` icon in `topIcons` next to Settings.)
3. **Exclusive hero — must be brand new.** All 5 existing Sovereigns are already obtainable (standard banner 20% Sovereign sub-roll; Aura Bloom has a scheduled event banner). Add a **6th Sovereign** flagged `shopExclusive: true`, and exclude it from the three gacha pools in `SummonScreen.js` (`:101, :135-141, :153`) via `&& !h.shopExclusive`.
4. **One atomic store action** (model on `performSummon` / `buyTowerBundle`):
   ```js
   purchaseShopPack(packId) → { ok, reason }
   // validate price → deduct (spendGems OR purchaseHandler)
   // in one set(): addHero(heroId) + addGems(g) + addGold(go)
   //             + ascensionInventory.aetheria_core += n
   // triggerSync(); mark purchased if one-time
   ```
   Add `shopPurchases` to state for one-time gating (or allow repeat buys — a repeat grants +1 copy, which helps the Sovereign reach transcendence; decide this).
5. **Pack grant** (your spec: hero + gems + gold + ascension material): include **N× Aetheria's Core** so the player can immediately ascend the new Sovereign — which is exactly why the Part 2 / B1 routing fix is mandatory (otherwise they own a Sovereign + Cores the game won't let them spend).

### Sovereign roster (for reference)
`hero_012` Aura Bloom (SUNSPIRE) · `hero_030` Iris Vale (VERDANIA) · `hero_033` Nyx Vael (VOIDMARK) · `hero_037` Aeloria (GLACIARA) · `hero_041` Ravenna Blaze (EMBERVEIL). The shop hero would be a **6th**, e.g. `hero_054`, `sovereign: true` + `shopExclusive: true`.

---

## Recommended build order

1. **Fix the Aetheria's Core routing bug** (route ascension item on `hero.sovereign`). Small; prerequisite for the shop hero to make sense; also fixes the existing 5 Sovereigns.
2. **Add the shop-exclusive 6th Sovereign** + gacha-pool exclusion in `SummonScreen.js`.
3. **`purchaseShopPack` store action** + `shopPurchases` tracking.
4. **`ShopScreen`** (clone TowerShop) + register route + wire the HUD `+` button.
5. **Decide A/B/C on monetization** — ship the gem-priced exclusive pack now; stub bundles behind the purchase handler for IAP later.
6. **(Optional cleanup)** HeroDetailScreen B3 / B5 / B6 / B7 / B8.

### Open decisions for the user
- Monetization path: **A** (real IAP now), **B** (pluggable, IAP later), or **C** (gem-priced exclusive hero, no IAP)?
- Exclusive hero pack: **one-time** or **repeatable** (repeat = +1 copy toward transcendence)?
- Pack contents: how many gems / gold / Aetheria's Cores, and which faction for the new 6th Sovereign?

---

## IAP integration

> Stack confirmed: Expo ~56.0.4, RN 0.85.3, **New Architecture**, **EAS already configured** (eas.json + projectId), backend is **Supabase** (`src/cloud/*` — not Firebase; the CLAUDE.md description is stale). No IAP dependency present yet.

### Decision: RevenueCat (`react-native-purchases`)

The shop sells **consumables** (gems, gem+gold bundles), which are the most fraud-prone IAP type and require **server-side receipt validation**. RevenueCat provides that out of the box, which removes the hardest/riskiest part of doing IAP correctly for a small team.

- First-class **Expo config plugin**, works with the existing **EAS** build flow (no eject).
- Handles both product types: **consumables** (gems/bundles) and a **non-consumable / one-time entitlement** (exclusive hero pack).
- **Free** to ~$2.5k/mo revenue, then 1% — no cost until actually earning.
- **Backend-agnostic** — coexists with Supabase; map RevenueCat's app-user-ID to the Supabase auth user so entitlements follow the account across devices.

**Runner-up — `expo-iap`** (hyochan, successor to `react-native-iap`): direct StoreKit / Play Billing, New-Arch + Expo-plugin ready, no third-party dependency/cost. Trade-off: **you own receipt validation** (would be a **Supabase Edge Function**). Choose only if avoiding the RevenueCat dependency is a hard requirement.

**Do NOT use `expo-in-app-purchases`** — deprecated/sunset, unmaintained for modern Expo SDKs, no New-Architecture support.

### Non-negotiables (any library)
- IAP **cannot run in Expo Go** → test in an **EAS dev build** (already set up). ✓
- Configure products in **App Store Connect (`com.trumpcard.game`)** + **Google Play Console**: gems/bundles as **consumable**, hero pack as **non-consumable** (or a one-time entitlement).
- **Apple/Google take 15–30%.**
- **Consumable flow:** grant currency in-store *then* finish/acknowledge the transaction; on Android a consumable must be explicitly **consumed** before it can be re-bought.

### How it plugs into the shop
Everything sits behind the single `purchaseHandler` interface (see Part 3 §4). Build the **entire shop now with a dev stub handler** (instant grant, fully testable), then drop RevenueCat in behind that interface once store products are configured — keeping store-approval lead time off the critical path.

**Wiring steps (when ready):**
1. `npx expo install react-native-purchases react-native-purchases-ui`; add the config plugin; rebuild the EAS dev client.
2. Create products in App Store Connect + Play Console (consumables + the hero-pack entitlement); create matching RevenueCat **Offerings/Packages**.
3. `Purchases.configure({ apiKey })` at app init; `Purchases.logIn(supabaseUserId)` after Supabase auth so entitlements bind to the account.
4. Implement the real `purchaseHandler`: `getOfferings()` → `purchasePackage()` → on success call the existing `purchaseShopPack(packId)` grant action → finish/consume.
5. (Optional hardening) RevenueCat **webhook → Supabase Edge Function** to reconcile grants server-side and guard against client tampering.
