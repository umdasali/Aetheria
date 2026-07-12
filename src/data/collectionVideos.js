// Per-faction ambient background videos for CollectionScreen. Swap which clip
// plays behind a faction's hero grid by editing a single line below — every
// require() must stay a static literal (Metro can't resolve dynamic paths),
// so add the new file under assets/video/ first, then point the key at it.
//
// 'All' is used for the unfiltered/all-heroes tab. Any faction key left
// pointing at DEFAULT_VIDEO just hasn't gotten a dedicated clip yet.
const DEFAULT_VIDEO = require('../../assets/video/codex-bg.mp4');
const EMBERVEIL_VIDEO = require('../../assets/video/emberveil-bg.mp4');
const VOIDMARK_VIDEO = require('../../assets/video/voidmark-bg.mp4');
const VERDANIA_VIDEO = require('../../assets/video/verdania-bg.mp4');


export const COLLECTION_FACTION_VIDEOS = {
  All:       DEFAULT_VIDEO,
  EMBERVEIL: EMBERVEIL_VIDEO,
  GLACIARA:  DEFAULT_VIDEO,
  SUNSPIRE:  DEFAULT_VIDEO,
  VERDANIA:  VERDANIA_VIDEO,
  VOIDMARK:  VOIDMARK_VIDEO,
  KHEMARA:   DEFAULT_VIDEO,
};

export function getCollectionVideo(factionKey) {
  return COLLECTION_FACTION_VIDEOS[factionKey] || DEFAULT_VIDEO;
}
