import { createAudioPlayer } from 'expo-audio';

// ── Volume state ─────────────────────────────────────────────────────────────
let _musicVolume = 0.65;
let _sfxVolume   = 0.75;

// ── Home BGM ──────────────────────────────────────────────────────────────────

const HOME_TRACKS = [
  require('../../assets/audio/home/BGM-Home_001.mp3'),
  require('../../assets/audio/home/BGM-Home_002.mp3'),
];

let _homePlayer = null;

function getHomePlayer() {
  if (!_homePlayer) {
    const track = HOME_TRACKS[Math.floor(Math.random() * HOME_TRACKS.length)];
    _homePlayer = createAudioPlayer(track);
    _homePlayer.loop   = true;
    _homePlayer.volume = _musicVolume;
  }
  return _homePlayer;
}

// ── Story BGM ─────────────────────────────────────────────────────────────────

const STORY_TRACKS = [
  require('../../assets/audio/story-mode/story_BGM-1.mp3'),
  require('../../assets/audio/story-mode/story_BGM-2.mp3'),
];

let _storyPlayer = null;

function getStoryPlayer() {
  if (!_storyPlayer) {
    const track = STORY_TRACKS[Math.floor(Math.random() * STORY_TRACKS.length)];
    _storyPlayer = createAudioPlayer(track);
    _storyPlayer.loop   = true;
    _storyPlayer.volume = _musicVolume;
  }
  return _storyPlayer;
}

// ── Collection BGM ────────────────────────────────────────────────────────────

const COLLECTION_BGM = require('../../assets/audio/Collection/collection_BGM.mp3');

let _collectionPlayer = null;

function getCollectionPlayer() {
  if (!_collectionPlayer) {
    _collectionPlayer = createAudioPlayer(COLLECTION_BGM);
    _collectionPlayer.loop   = true;
    _collectionPlayer.volume = _musicVolume;
  }
  return _collectionPlayer;
}

// ── Battle BGM ────────────────────────────────────────────────────────────────

const BATTLE_BGM = require('../../assets/audio/battleScreen/bgm_001.mp3');

let _battlePlayer = null;

function getBattlePlayer() {
  if (!_battlePlayer) {
    _battlePlayer = createAudioPlayer(BATTLE_BGM);
    _battlePlayer.loop   = true;
    _battlePlayer.volume = _musicVolume * 0.85;
  }
  return _battlePlayer;
}

// ── Attack SFX ────────────────────────────────────────────────────────────────

const ATTACK_SFX = require('../../assets/audio/battleScreen/attack-fx.mp3');

let _sfxPlayer = null;

function getSFXPlayer() {
  if (!_sfxPlayer) {
    _sfxPlayer = createAudioPlayer(ATTACK_SFX);
    _sfxPlayer.volume = _sfxVolume;
  }
  return _sfxPlayer;
}

// ── Card Flip SFX ─────────────────────────────────────────────────────────────

const CARD_FLIP_SFX = require('../../assets/audio/Summon/card-flip.wav');

let _cardFlipPlayer = null;

function getCardFlipPlayer() {
  if (!_cardFlipPlayer) {
    _cardFlipPlayer = createAudioPlayer(CARD_FLIP_SFX);
    _cardFlipPlayer.volume = _sfxVolume;
  }
  return _cardFlipPlayer;
}

// ── Button Click SFX ──────────────────────────────────────────────────────────

const BUTTON_SFX = require('../../assets/audio/button/button-click-fx-2.wav');

let _buttonPlayer = null;

function getButtonPlayer() {
  if (!_buttonPlayer) {
    _buttonPlayer = createAudioPlayer(BUTTON_SFX);
    _buttonPlayer.volume = _sfxVolume;
  }
  return _buttonPlayer;
}

// ── Reward Claim SFX ─────────────────────────────────────────────────────────

const REWARD_CLAIM_SFX = require('../../assets/audio/Collection/reward-claim.wav');

let _rewardClaimPlayer = null;

function getRewardClaimPlayer() {
  if (!_rewardClaimPlayer) {
    _rewardClaimPlayer = createAudioPlayer(REWARD_CLAIM_SFX);
    _rewardClaimPlayer.volume = _sfxVolume;
  }
  return _rewardClaimPlayer;
}

// ── Power Forge SFX ───────────────────────────────────────────────────────────

const POWER_FORGE_SFX = require('../../assets/audio/Collection/power-forge.wav');

let _powerForgePlayer = null;

function getPowerForgePlayer() {
  if (!_powerForgePlayer) {
    _powerForgePlayer = createAudioPlayer(POWER_FORGE_SFX);
    _powerForgePlayer.volume = _sfxVolume;
  }
  return _powerForgePlayer;
}

// ── Hero Level-Up SFX ─────────────────────────────────────────────────────────

const LEVEL_UP_SFX = require('../../assets/audio/Collection/hero-level-up-fx.mp3');

let _levelUpPlayer = null;

function getLevelUpPlayer() {
  if (!_levelUpPlayer) {
    _levelUpPlayer = createAudioPlayer(LEVEL_UP_SFX);
    _levelUpPlayer.volume = _sfxVolume;
  }
  return _levelUpPlayer;
}

// ── Victory SFX ───────────────────────────────────────────────────────────────

const VICTORY_SFX = require('../../assets/audio/victory/victory-fx.mp3');

let _victoryPlayer = null;

function getVictoryPlayer() {
  if (!_victoryPlayer) {
    _victoryPlayer = createAudioPlayer(VICTORY_SFX);
    _victoryPlayer.volume = _sfxVolume;
  }
  return _victoryPlayer;
}

// ── Defeat SFX ────────────────────────────────────────────────────────────────

const DEFEAT_SFX = require('../../assets/audio/victory/defeat-fx.mp3');

let _defeatPlayer = null;

function getDefeatPlayer() {
  if (!_defeatPlayer) {
    _defeatPlayer = createAudioPlayer(DEFEAT_SFX);
    _defeatPlayer.volume = _sfxVolume;
  }
  return _defeatPlayer;
}

// ── Public API ────────────────────────────────────────────────────────────────

const AudioManager = {
  // Home BGM
  playHome() {
    try { const p = getHomePlayer(); if (!p.playing) p.play(); } catch (_) {}
  },

  pauseHome() {
    try { if (_homePlayer?.playing) _homePlayer.pause(); } catch (_) {}
  },

  // Story BGM
  startStoryBGM() {
    try { const p = getStoryPlayer(); if (!p.playing) p.play(); } catch (_) {}
  },

  stopStoryBGM() {
    try { if (_storyPlayer?.playing) { _storyPlayer.pause(); _storyPlayer.seekTo(0); } } catch (_) {}
  },

  // Collection BGM
  startCollectionBGM() {
    try { const p = getCollectionPlayer(); if (!p.playing) p.play(); } catch (_) {}
  },

  stopCollectionBGM() {
    try { if (_collectionPlayer?.playing) { _collectionPlayer.pause(); _collectionPlayer.seekTo(0); } } catch (_) {}
  },

  // Battle BGM
  startBattleBGM() {
    try { const p = getBattlePlayer(); if (!p.playing) p.play(); } catch (_) {}
  },

  stopBattleBGM() {
    try { if (_battlePlayer?.playing) { _battlePlayer.pause(); _battlePlayer.seekTo(0); } } catch (_) {}
  },

  // Attack SFX — replay from start each call
  playAttackSFX() {
    try { const p = getSFXPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Card flip SFX — replay from start each call
  playCardFlipSFX() {
    try { const p = getCardFlipPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Button click SFX
  playButtonSFX() {
    try { const p = getButtonPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Reward claim SFX (daily reward, milestone collect)
  playRewardClaimSFX() {
    try { const p = getRewardClaimPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Power forge SFX (fusion, transcend, ascend)
  playPowerForgeSFX() {
    try { const p = getPowerForgePlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Hero level-up SFX
  playLevelUpSFX() {
    try { const p = getLevelUpPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Victory SFX — plays once on win
  playVictorySFX() {
    try { const p = getVictoryPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Defeat SFX — plays once on loss
  playDefeatSFX() {
    try { const p = getDefeatPlayer(); p.seekTo(0); p.play(); } catch (_) {}
  },

  // Volume control — call from SettingsScreen on slider change
  setMusicVolume(vol) {
    _musicVolume = Math.max(0, Math.min(1, vol));
    try { if (_homePlayer)       _homePlayer.volume       = _musicVolume;         } catch (_) {}
    try { if (_storyPlayer)      _storyPlayer.volume      = _musicVolume;         } catch (_) {}
    try { if (_collectionPlayer) _collectionPlayer.volume = _musicVolume;         } catch (_) {}
    try { if (_battlePlayer)     _battlePlayer.volume     = _musicVolume * 0.85;  } catch (_) {}
  },

  setSFXVolume(vol) {
    _sfxVolume = Math.max(0, Math.min(1, vol));
    try { if (_sfxPlayer)          _sfxPlayer.volume          = _sfxVolume; } catch (_) {}
    try { if (_cardFlipPlayer)     _cardFlipPlayer.volume     = _sfxVolume; } catch (_) {}
    try { if (_buttonPlayer)       _buttonPlayer.volume       = _sfxVolume; } catch (_) {}
    try { if (_rewardClaimPlayer)  _rewardClaimPlayer.volume  = _sfxVolume; } catch (_) {}
    try { if (_powerForgePlayer)   _powerForgePlayer.volume   = _sfxVolume; } catch (_) {}
    try { if (_levelUpPlayer)      _levelUpPlayer.volume      = _sfxVolume; } catch (_) {}
    try { if (_victoryPlayer)      _victoryPlayer.volume      = _sfxVolume; } catch (_) {}
    try { if (_defeatPlayer)       _defeatPlayer.volume       = _sfxVolume; } catch (_) {}
  },

  getMusicVolume() { return _musicVolume; },
  getSFXVolume()   { return _sfxVolume;   },

  releaseAll() {
    try { _homePlayer?.remove();       _homePlayer       = null; } catch (_) {}
    try { _storyPlayer?.remove();      _storyPlayer      = null; } catch (_) {}
    try { _collectionPlayer?.remove(); _collectionPlayer = null; } catch (_) {}
    try { _battlePlayer?.remove();     _battlePlayer     = null; } catch (_) {}
    try { _sfxPlayer?.remove();          _sfxPlayer          = null; } catch (_) {}
    try { _cardFlipPlayer?.remove();     _cardFlipPlayer     = null; } catch (_) {}
    try { _buttonPlayer?.remove();       _buttonPlayer       = null; } catch (_) {}
    try { _rewardClaimPlayer?.remove();  _rewardClaimPlayer  = null; } catch (_) {}
    try { _powerForgePlayer?.remove();   _powerForgePlayer   = null; } catch (_) {}
    try { _levelUpPlayer?.remove();      _levelUpPlayer      = null; } catch (_) {}
    try { _victoryPlayer?.remove();      _victoryPlayer      = null; } catch (_) {}
    try { _defeatPlayer?.remove();       _defeatPlayer       = null; } catch (_) {}
  },
};

export default AudioManager;
