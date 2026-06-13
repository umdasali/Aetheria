import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, FlatList, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { FACTIONS, getHeroById } from '../data/heroes';
import { C, RANK } from '../theme/colors';

const { width: W } = Dimensions.get('window');

const LEFT_W   = Math.floor(W * 0.36);
const RIGHT_W  = W - LEFT_W - 1;
const COLS     = 5;
const GRID_PAD = 10;
const GRID_GAP = 6;
const CARD_W   = Math.floor((RIGHT_W - GRID_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS);
const CARD_H   = Math.floor(CARD_W * 320 / 220);

export default function EditProfileScreen({ navigation }) {
  const playerProfile  = useGameStore(s => s.playerProfile);
  const ownedHeroes    = useGameStore(s => s.ownedHeroes);
  const heroCollection = useGameStore(s => s.heroCollection);
  const updateProfile  = useGameStore(s => s.updateProfile);

  const [editName,      setEditName]      = useState(playerProfile.name            || '');
  const [editSig,       setEditSig]       = useState(playerProfile.signature       || '');
  const [editAvatarId,  setEditAvatarId]  = useState(playerProfile.avatarHeroId    || null);
  const [editFactionId, setEditFactionId] = useState(playerProfile.favoriteFaction || null);

  const save = () => {
    updateProfile({
      name:            editName.trim() || 'Commander',
      signature:       editSig.trim(),
      avatarHeroId:    editAvatarId,
      favoriteFaction: editFactionId,
    });
    navigation.goBack();
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>EDIT PROFILE</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={save} activeOpacity={0.82} style={s.saveBtn}>
          <LinearGradient
            colors={C.GRAD_PINK}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.saveInner}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={s.saveTxt}>SAVE</Text>
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
              style={s.input}
              value={editName}
              onChangeText={setEditName}
              maxLength={20}
              placeholder="Commander"
              placeholderTextColor={C.TEXT_DISABLED}
              selectionColor={C.PRIMARY}
            />

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
                onPress={() => setEditFactionId(null)}
                style={[s.factionBtn, editFactionId === null && s.factionBtnSel]}
                activeOpacity={0.8}
              >
                <Ionicons name="shuffle" size={13} color={editFactionId === null ? C.PRIMARY : C.TEXT_MUTED} />
                <Text style={[s.factionTxt, editFactionId === null && { color: C.PRIMARY }]}>AUTO</Text>
              </TouchableOpacity>
              {Object.entries(FACTIONS).map(([key, faction]) => {
                const sel = editFactionId === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setEditFactionId(key)}
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

        {/* Right: hero avatar grid — all owned heroes */}
        <View style={s.rightPanel}>
          <View style={s.sectionHdr}>
            <View style={[s.sectionAccent, { backgroundColor: C.PRIMARY }]} />
            <Text style={s.sectionTitle}>AVATAR HERO</Text>
            <Text style={s.sectionHint}>{ownedHeroes.length} heroes · tap to select</Text>
          </View>
          <FlatList
            data={ownedHeroes}
            keyExtractor={id => id}
            numColumns={COLS}
            contentContainerStyle={s.heroGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: id }) => {
              const h = getHeroById(id);
              if (!h) return null;
              const sel           = editAvatarId === id;
              const effectiveRank = heroCollection[id]?.effectiveRank ?? h.rank;
              const r             = RANK[effectiveRank];
              return (
                <TouchableOpacity
                  onPress={() => setEditAvatarId(id)}
                  activeOpacity={0.82}
                  style={s.heroItem}
                  accessibilityLabel={`Select ${h.name}`}
                  accessibilityRole="button"
                >
                  <View style={[s.heroCard, { borderColor: sel ? r.glow : C.BORDER }]}>
                    <Image source={h.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.72)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[s.rankBadge, { backgroundColor: r.bg }]}>
                      <Text style={[s.rankTxt, { color: r.text }]}>{effectiveRank}</Text>
                    </View>
                    <Text style={s.heroName} numberOfLines={1}>{h.name}</Text>
                    {sel && (
                      <>
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: r.glow + '28', borderRadius: 8 }]} />
                        <View style={s.selectedIcon}>
                          <Ionicons name="checkmark-circle" size={16} color={C.SUCCESS} />
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
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  backBtn:   { padding: 4 },
  title:     { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 2.5 },
  saveBtn:   { borderRadius: 8, overflow: 'hidden' },
  saveInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  saveTxt:   { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  body:       { flex: 1, flexDirection: 'row' },

  leftPanel: {
    width: LEFT_W,
    borderRightWidth: 1, borderRightColor: C.BORDER,
    backgroundColor: C.BG_RAISED,
  },
  leftContent: { padding: 16 },

  fieldLbl: {
    fontSize: 10, fontWeight: '800', color: C.TEXT_MUTED,
    letterSpacing: 1.5, marginBottom: 6,
  },
  input: {
    backgroundColor: C.BG_BASE, borderRadius: 8,
    borderWidth: 1, borderColor: C.BORDER,
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: C.TEXT, marginBottom: 14,
  },
  inputMulti: { height: 60, textAlignVertical: 'top', paddingTop: 9 },

  factionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  factionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.BG_BASE,
    paddingHorizontal: 8, paddingVertical: 7,
    position: 'relative',
  },
  factionBtnSel: { borderColor: C.PRIMARY, backgroundColor: C.PRIMARY_GLOW },
  factionIcon:   { width: 16, height: 16 },
  factionTxt:    { fontSize: 10, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.5 },
  factionDot: {
    position: 'absolute', top: -3, right: -3,
    width: 7, height: 7, borderRadius: 4,
    borderWidth: 1, borderColor: C.BG_CARD,
  },

  divider: { width: 1, backgroundColor: C.BORDER },

  rightPanel:    { flex: 1 },
  sectionHdr: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: GRID_PAD, paddingTop: 10, paddingBottom: 8,
  },
  sectionAccent: { width: 3, height: 12, borderRadius: 2 },
  sectionTitle:  { fontSize: 10, fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
  sectionHint:   { fontSize: 10, fontWeight: '600', color: C.TEXT_MUTED },

  heroGrid: { paddingHorizontal: GRID_PAD, paddingBottom: 10, gap: GRID_GAP },
  heroItem:  { width: CARD_W, marginRight: GRID_GAP, marginBottom: 0 },
  heroCard: {
    width: CARD_W, height: CARD_H,
    borderRadius: 8, overflow: 'hidden', borderWidth: 1.5,
  },
  rankBadge: {
    position: 'absolute', top: 4, right: 4,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
  },
  rankTxt:  { fontSize: 9, fontWeight: '900' },
  heroName: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    fontSize: 9, fontWeight: '700', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  selectedIcon: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: C.BG_CARD + 'CC', borderRadius: 8,
  },
});
