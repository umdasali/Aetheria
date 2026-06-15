# Aetheria: Legends Unbound — Styling Reference

Quick-reference cheat sheet for screens and components. For the full token list see [AGENTS.md](AGENTS.md).

---

## Imports

```js
import { C, RANK } from '../theme/colors';           // always
import { FACTIONS } from '../data/heroes';            // only when you need a faction's specific color
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, StyleSheet } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
// W > H always — this is a landscape-only app
```

---

## Token Quick-Reference

### Screen backgrounds (darkest → lightest)

| Token | Use |
|---|---|
| `C.BG_SCREEN` | Home / loading screen root |
| `C.BG_DEEP` | Main body |
| `C.BG_BASE` | Panels, section rows |
| `C.BG_MID` | Slightly deeper panels |
| `C.BG_CARD` | Dark card surfaces |
| `C.BG_STATS` | Stat rows, inset sections |
| `C.BG_BOTTOM` | Footer strips, deepest insets |

### Text (white-on-dark scale)

| Token | Visible? | Use |
|---|---|---|
| `C.TEXT` | Full | Primary text |
| `C.TEXT_SOFT` | High | Secondary text |
| `C.TEXT_MUTED` | Medium | Labels, captions |
| `C.TEXT_DISABLED` | Low | Placeholders, disabled |
| `C.TEXT_ON_DARK` | 70% | Standard on dark bg |
| `C.TEXT_ON_DARK_SOFT` | 52% | Subtitles |
| `C.TEXT_ON_DARK_MUTED` | 45% | Secondary labels |

### Accents

| Token | Color | Use |
|---|---|---|
| `C.PRIMARY` | Purple | Main CTA, active state |
| `C.SECONDARY` | Hot pink | Secondary CTA, highlight |
| `C.GOLD` | Amber | Currency, rewards |
| `C.CYAN` | Cyan | Info, special state |
| `C.SUCCESS` | Green | In-team, claimed, done |
| `C.DANGER` | Red | Delete, lose, health low |
| `C.WARNING` | Amber | Caution, costs |

### Borders / Glass

| Token | Use |
|---|---|
| `C.BORDER` | Default panel border |
| `C.BORDER_STRONG` | Highlighted border |
| `C.BORDER_SUBTLE` | Faint divider |
| `C.GLASS_1` / `C.GLASS_2` | LinearGradient glass panel |
| `C.OVERLAY_3` | Badge background |
| `C.OVERLAY_4` | Full-screen dimmer |

### Gradients (pass to `colors={...}`)

| Token | Use |
|---|---|
| `C.GRAD_BG` | Full-screen root background |
| `C.GRAD_HEADER` | Header / top bar |
| `C.GRAD_PINK` | Primary CTA button (horizontal) |
| `C.GRAD_GOLD` | Gold / currency button |
| `C.GRAD_BATTLE` | Battle screen background |
| `C.GRAD_VICTORY` | Victory overlay |
| `C.GRAD_DEFEAT` | Defeat overlay |
| `C.GRAD_SUMMON` | Summon screen background |

### Stat colors

```js
C.HP    // red   — heart
C.ATK   // amber — sword
C.DEF   // cyan  — shield
C.CRIT  // purple — diamond
```

---

## Copy-Paste Patterns

### Screen root

```jsx
export default function MyScreen() {
  return (
    <LinearGradient colors={C.GRAD_BG} style={styles.root}>
      {/* header */}
      <LinearGradient colors={C.GRAD_HEADER} style={styles.header}>
        <Text style={styles.title}>SCREEN TITLE</Text>
      </LinearGradient>
      {/* body */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  title:  { color: C.TEXT, fontWeight: '900', fontSize: 16, letterSpacing: 3, textTransform: 'uppercase' },
});
```

### Glass panel

```jsx
<View style={styles.panel}>
  <LinearGradient colors={[C.GLASS_1, C.GLASS_2]} style={StyleSheet.absoluteFill} />
  {/* content */}
</View>

// style:
panel: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.BORDER }
```

### Badge / pill

```jsx
<View style={[styles.badge, { backgroundColor: color + '18', borderColor: color }]}>
  <Text style={[styles.badgeText, { color }]}>LABEL</Text>
</View>

// styles:
badge:     { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
badgeText: { fontWeight: '700', fontSize: 9 },
```

### Rank badge

```jsx
import { RANK } from '../theme/colors';
const r = RANK[hero.effectiveRank ?? hero.rank]; // { bg, text, glow }

<View style={[styles.rankBadge, { backgroundColor: r.bg, shadowColor: r.glow }]}>
  <Text style={{ color: r.text, fontWeight: '900', fontSize: 10 }}>
    {hero.effectiveRank ?? hero.rank}
  </Text>
</View>
```

### Faction color (the only raw-color exception)

```jsx
import { FACTIONS } from '../data/heroes';
const factionColor = FACTIONS[hero.faction].color;
// Use this color directly — it is intentionally per-faction, not a C.* token
```

### CTA button (horizontal gradient)

```jsx
<TouchableOpacity onPress={...} style={styles.btn}>
  <LinearGradient colors={C.GRAD_PINK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnInner}>
    <Text style={styles.btnText}>CONFIRM</Text>
  </LinearGradient>
</TouchableOpacity>

// styles:
btn:      { borderRadius: 8, overflow: 'hidden' },
btnInner: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
btnText:  { color: C.TEXT, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
```

### Text on image (legibility)

```jsx
<Text style={{
  color: C.TEXT,
  textShadowColor: 'rgba(0,0,0,0.9)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
}}>
  Hero Name
</Text>
```

### Divider

```jsx
<View style={{ height: 1, backgroundColor: C.BORDER_SUBTLE, marginVertical: 8 }} />
```

---

## Typography Scale

| Role | `fontWeight` | `fontSize` | `letterSpacing` | Notes |
|---|---|---|---|---|
| Screen title | `'900'` | 14–18 | 2–4 | All caps |
| Section header | `'800'` | 11–13 | 1–2 | All caps |
| Button label | `'800'` | 12–14 | 0.5–1 | |
| Stat value | `'700'`–`'800'` | 14–20 | — | Use stat color |
| Body / lore | `'600'` | 11–13 | — | `lineHeight` 16–20 |
| Small label | `'700'` | 8–10 | 0.5–1 | Uppercase |
| Footer / card ID | `'500'`–`'600'` | 7–9 | 0.5 | `C.TEXT_MUTED` |

---

## Spacing & Sizing

| Purpose | Value |
|---|---|
| Panel padding | 8, 10, 12, 14 |
| Border radius — badge/pill | 4 |
| Border radius — card/button | 8 |
| Border radius — panel | 10 |
| Border radius — modal | 16 |
| Divider width | 1, `C.BORDER_SUBTLE` |
| Min touch target | 30 × 30 |

---

## Animation Rules

```js
// Always useNativeDriver: true — unless animating width/height/padding (layout props)

Animated.spring(val, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true })
Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true })

// Loop (weather, particles)
Animated.loop(Animated.sequence([...]))

// Parallel (hit shake + flash at same time)
Animated.parallel([
  Animated.timing(shake, { toValue: 1, duration: 200, useNativeDriver: true }),
  Animated.timing(flash, { toValue: 0, duration: 350, useNativeDriver: true }),
])
```

---

## Common Mistakes

| Wrong | Right |
|---|---|
| `color: '#7C3AED'` | `color: C.PRIMARY` |
| `backgroundColor: 'rgba(0,0,0,0.6)'` | `backgroundColor: C.OVERLAY_4` |
| `borderColor: '#A78BFA44'` | `borderColor: C.BORDER` |
| `color: '#F0EAFF'` | `color: C.TEXT` |
| `color: hero.factionColor` | `color: FACTIONS[hero.faction].color` |
| `RANK[hero.rank]` when hero is fused | `RANK[hero.effectiveRank ?? hero.rank]` |
| `useNativeDriver: false` on opacity/transform | `useNativeDriver: true` |
| Assuming `H > W` | `W > H` always (landscape-only) |
| Inline style on list item render | `StyleSheet.create(...)` |

---

## Source of Truth

| What | File |
|---|---|
| All `C.*` tokens | [src/theme/colors.js](src/theme/colors.js) |
| `RANK` badge colors | [src/theme/colors.js](src/theme/colors.js) |
| `FACTIONS` map + faction colors | [src/data/heroes.js](src/data/heroes.js) |
| Hero data model | [src/data/heroes.js](src/data/heroes.js) |
| Battle engine / damage formula | [src/utils/battleEngine.js](src/utils/battleEngine.js) |
| Full coding rules | [AGENTS.md](AGENTS.md) |
