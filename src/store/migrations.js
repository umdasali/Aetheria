export const CURRENT_VERSION = 6;

export function migrate(persistedState, fromVersion) {
  let state = { ...persistedState };

  // v0 → v1: guarantee towerCoins and schemaVersion exist
  if (fromVersion < 1) {
    state = { ...state, towerCoins: state.towerCoins ?? 0, schemaVersion: 1 };
  }

  // v1 → v2: add ascensionInventory + ascension field on every heroCollection entry
  if (fromVersion < 2) {
    state = {
      ...state,
      schemaVersion: 2,
      ascensionInventory: state.ascensionInventory ?? {
        aetheria_core:   0,
        feather_of_hope: 0,
        lost_butterfly:  0,
        broken_wing:     0,
      },
      heroCollection: Object.fromEntries(
        Object.entries(state.heroCollection || {}).map(([id, data]) => [
          id,
          { ...data, ascension: data.ascension ?? 0 },
        ])
      ),
    };
  }

  // v2 → v3: add pullHistory, achievements, eventPity, eventGuarantee
  if (fromVersion < 3) {
    state = {
      ...state,
      schemaVersion:              3,
      pullHistory:                state.pullHistory ?? [],
      achievements:               state.achievements ?? {},
      pendingAchievementUnlocks:  state.pendingAchievementUnlocks ?? [],
      eventPity:                  state.eventPity ?? {},
      eventGuarantee:             state.eventGuarantee ?? {},
    };
  }

  // v3 → v4: replace hero-based profile picture with a dedicated avatar image id
  if (fromVersion < 4) {
    const { avatarHeroId, ...restProfile } = state.playerProfile || {};
    state = {
      ...state,
      schemaVersion: 4,
      playerProfile: {
        ...restProfile,
        avatarId: state.playerProfile?.avatarId ?? 'avatar-01',
      },
    };
  }

  // v4 → v5: pendingMilestoneReward (single slot) → pendingMilestoneRewards (queue).
  // The old slot silently overwrote an unclaimed reward when a second milestone
  // fired before the first was collected — carry any unclaimed one forward.
  if (fromVersion < 5) {
    const { pendingMilestoneReward, ...rest } = state;
    state = {
      ...rest,
      schemaVersion: 5,
      pendingMilestoneRewards: state.pendingMilestoneRewards ?? (pendingMilestoneReward ? [pendingMilestoneReward] : []),
    };
  }

  // v5 → v6: add processedIapTransactionIds (RevenueCat transaction-recovery dedupe).
  if (fromVersion < 6) {
    state = {
      ...state,
      schemaVersion: 6,
      processedIapTransactionIds: state.processedIapTransactionIds ?? [],
    };
  }

  return state;
}
