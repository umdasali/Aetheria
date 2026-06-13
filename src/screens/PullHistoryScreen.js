import { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { ALL_EVENTS } from '../data/events';
import { C, RANK } from '../theme/colors';

const FILTERS = ['ALL', 'S', 'A', 'B', 'C'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PullHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const pullHistory = useGameStore(s => s.pullHistory);
  const pity        = useGameStore(s => s.pity);
  const eventPity   = useGameStore(s => s.eventPity ?? {});

  const lastBannerType   = pullHistory[0]?.bannerType ?? 'standard';
  const isStandardBanner = lastBannerType === 'standard';
  const lastBannerEvent  = !isStandardBanner ? ALL_EVENTS.find(e => e.id === lastBannerType) : null;
  const displayPity      = isStandardBanner ? pity : (eventPity[lastBannerType] ?? 0);
  const displayMax       = isStandardBanner ? 90 : (lastBannerEvent?.pityLimit ?? 80);
  const pityLabel        = isStandardBanner ? 'PITY' : 'EVENT';

  const [filter, setFilter] = useState('ALL');

  const entries = useMemo(() => {
    if (filter === 'ALL') return pullHistory;
    return pullHistory.filter(e => e.rank === filter);
  }, [pullHistory, filter]);

  const renderItem = ({ item, index }) => {
    const r = RANK[item.rank] ?? RANK.C;
    const isEven = index % 2 === 0;
    return (
      <View style={[s.row, isEven && s.rowAlt]}>
        {/* Rank badge */}
        <View style={[s.rankBadge, { backgroundColor: r.bg }]}>
          <Text style={[s.rankTxt, { color: r.text }]}>{item.rank}</Text>
        </View>

        {/* Hero name */}
        <Text style={s.heroName} numberOfLines={1}>{item.heroName}</Text>

        {/* Banner type */}
        <View style={s.bannerChip}>
          <Text style={s.bannerChipTxt}>
            {item.bannerType === 'standard' ? 'STD' : 'EVT'}
          </Text>
        </View>

        {/* Pity badge */}
        {item.isPity && (
          <View style={s.pityBadge}>
            <Text style={s.pityBadgeTxt}>PITY</Text>
          </View>
        )}

        {/* Date */}
        <Text style={s.dateTxt}>{formatDate(item.pulledAt)}</Text>
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={s.emptyWrap}>
      <Ionicons name="time-outline" size={48} color={C.TEXT_DISABLED} />
      <Text style={s.emptyTxt}>No pulls recorded yet</Text>
      <Text style={s.emptySub}>Your summon history will appear here</Text>
    </View>
  );

  return (
    <View style={[s.root, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>PULL HISTORY</Text>
          <Text style={s.headerSub}>{pullHistory.length} / 300 records</Text>
        </View>
        {/* Pity counter — reflects the banner type of the most recent pull */}
        <View style={s.pityChip}>
          <Text style={s.pityChipLabel}>{pityLabel}</Text>
          <Text style={s.pityChipCount}>{displayPity}</Text>
          <Text style={s.pityChipMax}>/{displayMax}</Text>
        </View>
      </LinearGradient>

      {/* Body: sidebar filter + list */}
      <View style={s.body}>
        {/* Left sidebar — rank filter */}
        <View style={s.sidebar}>
          <LinearGradient colors={[C.BG_BASE, C.BG_MID]} style={StyleSheet.absoluteFill} />
          {FILTERS.map(f => {
            const active = filter === f;
            const r = f !== 'ALL' ? RANK[f] : null;
            return (
              <TouchableOpacity
                key={f}
                style={[s.filterBtn, active && s.filterBtnActive, r && active && { borderColor: r.glow }]}
                onPress={() => setFilter(f)}
                activeOpacity={0.75}
              >
                {r ? (
                  <View style={[s.filterRankDot, { backgroundColor: r.bg }]}>
                    <Text style={[s.filterRankLbl, { color: r.text }]}>{f}</Text>
                  </View>
                ) : (
                  <Ionicons name="list-outline" size={16} color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED} />
                )}
                <Text style={[s.filterTxt, active && s.filterTxtActive, r && active && { color: r.glow }]}>
                  {f}
                </Text>
                {active && <View style={s.filterActiveLine} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right: list */}
        <View style={s.listWrap}>
          {/* Column headers */}
          <View style={s.listHeader}>
            <Text style={[s.colHdr, { width: 32 }]}>RANK</Text>
            <Text style={[s.colHdr, { flex: 1 }]}>HERO</Text>
            <Text style={[s.colHdr, { width: 36 }]}>TYPE</Text>
            <Text style={[s.colHdr, { width: 46 }]}></Text>
            <Text style={[s.colHdr, { width: 130 }]}>DATE</Text>
          </View>
          <FlatList
            data={entries}
            keyExtractor={(item, index) => item.pulledAt + '_' + item.heroId + '_' + index}
            renderItem={renderItem}
            ListEmptyComponent={ListEmpty}
            showsVerticalScrollIndicator={false}
            initialNumToRender={30}
            maxToRenderPerBatch={30}
            windowSize={5}
          />
        </View>
      </View>
    </View>
  );
}

const SIDEBAR_W = 80;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.GLASS_7,
  },
  backBtn:      { padding: 4, marginRight: 6 },
  headerTitle:  { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  headerSub:    { fontSize: 10, color: C.TEXT_ON_DARK_SOFT, marginTop: 1 },
  pityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.PRIMARY + '22', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '44',
  },
  pityChipLabel: { fontSize: 8, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1.5 },
  pityChipCount: { fontSize: 14, fontWeight: '900', color: C.PRIMARY_LIGHT },
  pityChipMax:   { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '700' },

  // Body
  body:    { flex: 1, flexDirection: 'row' },
  sidebar: { width: SIDEBAR_W, overflow: 'hidden', borderRightWidth: 1, borderRightColor: C.BORDER_SUBTLE },

  filterBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 12, position: 'relative',
    borderRightWidth: 2, borderRightColor: 'transparent',
  },
  filterBtnActive: { backgroundColor: C.PRIMARY + '12', borderRightColor: C.PRIMARY_LIGHT },
  filterActiveLine: {
    position: 'absolute', right: 0, top: 8, bottom: 8,
    width: 2, borderRadius: 2, backgroundColor: C.PRIMARY_LIGHT,
  },
  filterRankDot: {
    width: 26, height: 26, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  filterRankLbl:  { fontSize: 11, fontWeight: '900' },
  filterTxt:      { fontSize: 8, color: C.TEXT_MUTED, fontWeight: '700', letterSpacing: 0.5 },
  filterTxtActive:{ color: C.PRIMARY_LIGHT },

  // List
  listWrap: { flex: 1 },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.BG_STATS,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  colHdr: { fontSize: 8, fontWeight: '800', color: C.TEXT_DISABLED, letterSpacing: 1.5 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  rowAlt: { backgroundColor: C.GLASS_2 },

  rankBadge: { width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  rankTxt:   { fontSize: 10, fontWeight: '900' },

  heroName: { flex: 1, fontSize: 11, fontWeight: '700', color: C.TEXT, letterSpacing: 0.3 },

  bannerChip: {
    width: 36, borderRadius: 4,
    backgroundColor: C.GLASS_4, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 2,
  },
  bannerChipTxt: { fontSize: 8, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.5 },

  pityBadge: {
    width: 46, borderRadius: 4, paddingVertical: 2, alignItems: 'center',
    backgroundColor: C.GOLD + '22', borderWidth: 1, borderColor: C.GOLD + '66',
  },
  pityBadgeTxt: { fontSize: 7, fontWeight: '900', color: C.GOLD, letterSpacing: 1 },

  dateTxt: { width: 130, fontSize: 9, color: C.TEXT_MUTED, fontWeight: '500' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTxt:  { fontSize: 14, fontWeight: '700', color: C.TEXT_MUTED },
  emptySub:  { fontSize: 11, color: C.TEXT_DISABLED },
});
