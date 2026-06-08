export const CURRENT_VERSION = 2;

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

  return state;
}
