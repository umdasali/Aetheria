import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, FlatList, TextInput, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { FACTIONS } from '../data/heroes';
import { AVATARS } from '../data/avatars';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';
import AudioManager from '../utils/AudioManager';
import { NAME_PATTERN, checkNameAvailable, claimName, renameName } from '../cloud/nameService';
import { getUser, onAuthChanged } from '../cloud/auth';

const { width: W } = Dimensions.get('window');

const LEFT_W   = Math.floor(W * 0.36);
const RIGHT_W  = W - LEFT_W - 1;
const COLS     = 5;
const GRID_PAD = 10;
const GRID_GAP = 6;
const CARD_W   = Math.floor((RIGHT_W - GRID_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS);
const CARD_H   = CARD_W; // avatars are 1:1

const NAME_HINT = '3-16 characters — letters, numbers, spaces, - or _';

const NAME_STATUS = [
  { key: 'unchanged', text: NAME_HINT,                    color: C.TEXT_MUTED },
  { key: 'invalid',   text: NAME_HINT,                    color: C.DANGER },
  { key: 'checking',  text: 'Checking availability…',     color: C.TEXT_MUTED },
  { key: 'available', text: 'Name is available',          color: C.SUCCESS },
  { key: 'taken',     text: 'That name is already taken', color: C.DANGER },
];

export default function EditProfileScreen({ navigation }) {
  const playerProfile  = useGameStore(s => s.playerProfile);
  const updateProfile  = useGameStore(s => s.updateProfile);
  const playerUid      = useGameStore(s => s.playerUid);

  // The Commander name is a globally-unique, server-claimed identity — only
  // available to registered (signed-in) players, claimed together with their
  // account at CloudAuthScreen sign-up. Guests keep the local default name.
  const [registered, setRegistered] = useState(!!getUser());
  useEffect(() => onAuthChanged(user => setRegistered(!!user)), []);

  const [editName,      setEditName]      = useState(playerProfile.name            || '');
  const [editSig,       setEditSig]       = useState(playerProfile.signature       || '');
  const [editAvatarId,  setEditAvatarId]  = useState(playerProfile.avatarId        || 'avatar-01');
  const [editFactionId, setEditFactionId] = useState(playerProfile.favoriteFaction || null);

  // ── Name change validation ──────────────────────────────────────────────────
  // The player's original name was claimed server-side as globally unique (see
  // OnboardingScreen.js / supabase/migrations/0003_player_names.sql). Renaming
  // here must go through the same claim system instead of writing playerProfile
  // .name directly — otherwise a player could freely rename to a duplicate of
  // someone else's claimed name (which also leaks onto the public leaderboard).
  const [nameStatus, setNameStatus] = useState('unchanged'); // unchanged|invalid|checking|available|taken
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const checkIdRef = useRef(0);

  useEffect(() => {
    const trimmed = editName.trim();
    if (trimmed === (playerProfile.name || '').trim()) {
      checkIdRef.current += 1;
      setNameStatus('unchanged');
      return;
    }
    if (!NAME_PATTERN.test(trimmed)) {
      checkIdRef.current += 1;
      setNameStatus('invalid');
      return;
    }
    setNameStatus('checking');
    const myCheckId = ++checkIdRef.current;
    const t = setTimeout(async () => {
      const res = await checkNameAvailable(trimmed);
      if (checkIdRef.current !== myCheckId) return; // superseded by a newer edit
      // Can't verify while offline/unreachable — don't block typing over it;
      // the actual claim attempt on Save is still the source of truth.
      setNameStatus(res.networkError ? 'unchanged' : (res.available ? 'available' : 'taken'));
    }, 450);
    return () => clearTimeout(t);
  }, [editName, playerProfile.name]);

  const save = async () => {
    AudioManager.playButtonSFX();
    const trimmed = editName.trim();
    const oldName = (playerProfile.name || '').trim();
    // The name last CONFIRMED registered server-side — may lag behind oldName
    // if a previous claim/rename here or in Onboarding hit a networkError and
    // only committed locally. Renaming against a stale server name would fail
    // ownership checks, so fall back to claiming fresh when nothing is
    // confirmed yet (see retryPendingNameClaim() in gameStore.js).
    const serverName = (useGameStore.getState().serverClaimedName || '').trim();

    const commitProfile = (name) => {
      updateProfile({
        name,
        signature:       editSig.trim(),
        avatarId:        editAvatarId,
        favoriteFaction: editFactionId,
      });
      navigation.goBack();
    };

    // Unchanged name — skip validation/claim entirely and just save the other
    // fields. Important for accounts whose current name predates NAME_PATTERN
    // enforcement here (e.g. saved through this screen before this fix): without
    // this early return, those players would be permanently blocked from saving
    // ANY profile change (even just a new avatar) until they also fix their name.
    if (trimmed === oldName) {
      commitProfile(trimmed);
      return;
    }

    if (!NAME_PATTERN.test(trimmed)) {
      setNameStatus('invalid');
      return;
    }
    if (nameStatus === 'taken' || saving) return;

    setSaving(true);
    setSaveError('');
    const res = serverName
      ? await renameName(serverName, trimmed, playerUid)
      : await claimName(trimmed, playerUid);
    setSaving(false);

    if (res.claimed || res.renamed) {
      useGameStore.setState({ serverClaimedName: res.displayName || trimmed, pendingNameClaim: null });
      commitProfile(res.displayName || trimmed);
    } else if (res.networkError) {
      // Offline-friendly: commit locally, but leave the real server
      // registration pointing at serverName until a later retry succeeds
      // (see retryPendingNameClaim() in gameStore.js) instead of quietly
      // treating this attempt as done.
      useGameStore.setState({ pendingNameClaim: trimmed });
      commitProfile(res.displayName || trimmed);
    } else if (res.reason === 'taken') {
      setNameStatus('taken');
    } else if (res.reason === 'not_owner') {
      setSaveError('Could not verify your existing name. Please try again.');
    } else {
      setNameStatus('invalid');
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
        <TouchableOpacity
          onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={rs(22)} color={C.TEXT} />
        </TouchableOpacity>
        <Text style={s.title}>EDIT PROFILE</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={save}
          activeOpacity={0.82}
          style={s.saveBtn}
          disabled={saving || nameStatus === 'taken' || nameStatus === 'invalid'}
        >
          <LinearGradient
            colors={(saving || nameStatus === 'taken' || nameStatus === 'invalid') ? [C.GLASS_5, C.GLASS_5] : C.GRAD_PINK}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.saveInner}
          >
            {saving
              ? <ActivityIndicator size="small" color={C.TEXT} />
              : <Ionicons name="checkmark" size={rs(18)} color={C.TEXT} />}
            <Text style={s.saveTxt}>{saving ? 'SAVING…' : 'SAVE'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Body */}
      <View style={s.body}>

        {/* Left: form fields */}
        <View style={s.leftPanel}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.leftContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.fieldLbl}>DISPLAY NAME</Text>
            <TextInput
              style={[s.input, !registered && s.inputDisabled]}
              value={editName}
              onChangeText={setEditName}
              maxLength={16}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Commander"
              placeholderTextColor={C.TEXT_DISABLED}
              selectionColor={C.PRIMARY}
              editable={registered}
            />
            {registered ? (
              <>
                <View style={s.nameStatusRow}>
                  {(() => {
                    const info = NAME_STATUS.find(st => st.key === nameStatus) ?? NAME_STATUS[0];
                    return (
                      <>
                        {nameStatus === 'checking'  && <Ionicons name="ellipsis-horizontal" size={rf(11)} color={info.color} />}
                        {nameStatus === 'available' && <Ionicons name="checkmark-circle"    size={rf(11)} color={info.color} />}
                        {(nameStatus === 'taken' || nameStatus === 'invalid') && <Ionicons name="alert-circle" size={rf(11)} color={info.color} />}
                        <Text style={[s.nameStatusText, { color: info.color }]}>{info.text}</Text>
                      </>
                    );
                  })()}
                </View>
                {saveError ? <Text style={[s.nameStatusText, { color: C.DANGER }]}>{saveError}</Text> : null}
              </>
            ) : (
              <TouchableOpacity
                style={s.registerCta}
                onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('CloudAuth'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="lock-closed-outline" size={rf(11)} color={C.PRIMARY_LIGHT} />
                <Text style={s.registerCtaTxt}>Register your account to set a name</Text>
              </TouchableOpacity>
            )}

            <Text style={s.fieldLbl}>SIGNATURE</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={editSig}
              onChangeText={setEditSig}
              maxLength={60}
              multiline
              numberOfLines={2}
              placeholder="Add a short signature…"
              placeholderTextColor={C.TEXT_DISABLED}
              selectionColor={C.PRIMARY}
            />

            <Text style={s.fieldLbl}>FAVORITE FACTION</Text>
            <View style={s.factionGrid}>
              <TouchableOpacity
                onPress={() => { AudioManager.playButtonSFX(); setEditFactionId(null); }}
                style={[s.factionBtn, editFactionId === null && s.factionBtnSel]}
                activeOpacity={0.8}
              >
                <Ionicons name="shuffle" size={rs(17)} color={editFactionId === null ? C.PRIMARY : C.TEXT_MUTED} />
                <Text style={[s.factionTxt, editFactionId === null && { color: C.PRIMARY }]}>AUTO</Text>
              </TouchableOpacity>
              {Object.entries(FACTIONS).map(([key, faction]) => {
                const sel = editFactionId === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => { AudioManager.playButtonSFX(); setEditFactionId(key); }}
                    activeOpacity={0.8}
                    style={[
                      s.factionBtn,
                      sel && { borderColor: faction.color, backgroundColor: faction.color + '22' },
                    ]}
                  >
                    <Image source={faction.image} style={s.factionIcon} resizeMode="contain" />
                    <Text style={[s.factionTxt, sel && { color: faction.color }]} numberOfLines={1}>
                      {key}
                    </Text>
                    {sel && <View style={[s.factionDot, { backgroundColor: faction.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Right: avatar grid — dedicated profile avatars */}
        <View style={s.rightPanel}>
          <View style={s.sectionHdr}>
            <View style={[s.sectionAccent, { backgroundColor: C.PRIMARY }]} />
            <Text style={s.sectionTitle}>AVATAR</Text>
            <Text style={s.sectionHint}>{AVATARS.length} avatars · tap to select</Text>
          </View>
          <FlatList
            data={AVATARS}
            keyExtractor={a => a.id}
            numColumns={COLS}
            contentContainerStyle={s.heroGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: avatar, index }) => {
              const sel = editAvatarId === avatar.id;
              // Only the non-last column in each row needs a right margin — the
              // grid's contentContainerStyle already supplies the row-to-row (gap)
              // spacing. Applying marginRight unconditionally to every item (as
              // before) added one extra GRID_GAP per row beyond what CARD_W's math
              // reserves, overflowing the rightmost avatar past the panel edge.
              const isLastInRow = (index + 1) % COLS === 0;
              return (
                <TouchableOpacity
                  onPress={() => { AudioManager.playButtonSFX(); setEditAvatarId(avatar.id); }}
                  activeOpacity={0.82}
                  style={[s.heroItem, !isLastInRow && { marginRight: GRID_GAP }]}
                  accessibilityLabel={`Select ${avatar.id}`}
                  accessibilityRole="button"
                >
                  <View style={[s.heroCard, { borderColor: sel ? C.PRIMARY_LIGHT : C.BORDER }]}>
                    <Image source={avatar.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {sel && (
                      <>
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.PRIMARY_GLOW, borderRadius: 8 }]} />
                        <View style={s.selectedIcon}>
                          <Ionicons name="checkmark-circle" size={rs(20)} color={C.SUCCESS} />
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), paddingVertical: rs(11), gap: rs(10),
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  backBtn:   { padding: rs(4) },
  title:     { fontSize: rf(13), fontWeight: '900', color: C.TEXT, letterSpacing: 2.5 },
  saveBtn:   { borderRadius: rs(8), overflow: 'hidden' },
  saveInner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    paddingHorizontal: rs(16), paddingVertical: rs(8),
  },
  saveTxt:   { fontSize: rf(12), fontWeight: '800', color: C.TEXT, letterSpacing: 1 },

  body:       { flex: 1, flexDirection: 'row' },

  leftPanel: {
    width: LEFT_W,
    borderRightWidth: 1, borderRightColor: C.BORDER,
    backgroundColor: C.BG_RAISED,
  },
  leftContent: { padding: rs(16) },

  fieldLbl: {
    fontSize: rf(12), fontWeight: '800', color: C.TEXT_MUTED,
    letterSpacing: 1.5, marginBottom: rs(6),
  },
  input: {
    backgroundColor: C.BG_BASE, borderRadius: rs(8),
    borderWidth: 1, borderColor: C.BORDER,
    paddingHorizontal: rs(12), paddingVertical: rs(9),
    fontSize: rf(13), color: C.TEXT, marginBottom: rs(6),
  },
  inputMulti: { height: rs(60), textAlignVertical: 'top', paddingTop: rs(9) },
  inputDisabled: { opacity: 0.45 },

  nameStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    marginBottom: rs(12),
  },
  nameStatusText: { fontSize: rf(11), fontWeight: '600' },
  registerCta: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    marginBottom: rs(12),
  },
  registerCtaTxt: {
    fontSize: rf(11), fontWeight: '600', color: C.PRIMARY_LIGHT,
    textDecorationLine: 'underline',
  },

  factionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6) },
  factionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    borderRadius: rs(8), borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.BG_BASE,
    paddingHorizontal: rs(8), paddingVertical: rs(7),
    position: 'relative',
  },
  factionBtnSel: { borderColor: C.PRIMARY, backgroundColor: C.PRIMARY_GLOW },
  factionIcon:   { width: rs(16), height: rs(16) },
  factionTxt:    { fontSize: rf(12), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.5 },
  factionDot: {
    position: 'absolute', top: -3, right: -3,
    width: rs(7), height: rs(7), borderRadius: rs(4),
    borderWidth: 1, borderColor: C.BG_CARD,
  },

  divider: { width: 1, backgroundColor: C.BORDER },

  rightPanel:    { flex: 1 },
  sectionHdr: {
    flexDirection: 'row', alignItems: 'center', gap: rs(7),
    paddingHorizontal: GRID_PAD, paddingTop: rs(10), paddingBottom: rs(8),
  },
  sectionAccent: { width: 3, height: rs(12), borderRadius: 2 },
  sectionTitle:  { fontSize: rf(12), fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
  sectionHint:   { fontSize: rf(12), fontWeight: '600', color: C.TEXT_MUTED },

  heroGrid: { paddingHorizontal: GRID_PAD, paddingBottom: 10, gap: GRID_GAP },
  // marginRight is applied conditionally per-item in renderItem (skipped on the
  // last column) so rows don't overflow the panel width — see the FlatList above.
  heroItem:  { width: CARD_W, marginBottom: 0 },
  heroCard: {
    width: CARD_W, height: CARD_H,
    borderRadius: 8, overflow: 'hidden', borderWidth: 1.5,
  },
  rankBadge: {
    position: 'absolute', top: rs(4), right: rs(4),
    paddingHorizontal: rs(4), paddingVertical: 1, borderRadius: rs(3),
  },
  rankTxt:  { fontSize: rf(12), fontWeight: '900' },
  heroName: {
    position: 'absolute', bottom: rs(4), left: rs(4), right: rs(4),
    fontSize: rf(12), fontWeight: '700', color: C.TEXT,
    textShadowColor: C.TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  selectedIcon: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: C.BG_CARD + 'CC', borderRadius: 8,
  },
});
