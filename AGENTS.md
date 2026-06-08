# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

# Color Schema — MANDATORY

**Never use bare hex values or hardcoded rgba strings in screens or components.**
Always import `C` (and `RANK` when needed) from `src/theme/colors.js` and use the tokens.

```js
import { C, RANK } from '../theme/colors';
```

## Token quick-reference

### Backgrounds (dark theme)

| Token | Value | Use for |
|---|---|---|
| `C.BG_DEEP` | `#08031A` | Main body / dark purple-black |
| `C.BG_BASE` | `#0E0720` | Panels / section rows |
| `C.BG_MID` | `#160B2E` | Slightly deeper panels |
| `C.BG_CARD` | `#1C0F38` | Dark card surface |
| `C.BG_RAISED` | `#120A2A` | Dark elevated surface |
| `C.BG_STATS` | `#0C0620` | Stat rows / inset sections |
| `C.BG_BOTTOM` | `#060214` | Deepest inset / footer strips |
| `C.BG_SCREEN` | `#06030F` | Home / loading screen bg |
| `C.BG_VOID` | `#020010` | Near-black starfield |
| `C.BG_DARK` | `#0A0520` | Very dark purple-black |

### Borders

| Token | Value | Use for |
|---|---|---|
| `C.BORDER` | `rgba(167,139,250,0.18)` | Default borders |
| `C.BORDER_STRONG` | `rgba(167,139,250,0.42)` | Highlighted borders |
| `C.BORDER_SUBTLE` | `rgba(255,255,255,0.07)` | Very faint dividers |

### Glass / white surface tints

| Token | Value | Use for |
|---|---|---|
| `C.GLASS_1` | `rgba(255,255,255,0.025)` | Barely-there panel tint |
| `C.GLASS_2` | `rgba(255,255,255,0.04)` | Inset bars, inactive dots |
| `C.GLASS_3` | `rgba(255,255,255,0.05)` | Idle tab / button bg |
| `C.GLASS_4` | `rgba(255,255,255,0.06)` | Chip bg |
| `C.GLASS_5` | `rgba(255,255,255,0.08)` | Dividers / cell borders |
| `C.GLASS_6` | `rgba(255,255,255,0.10)` | Tab borders |
| `C.GLASS_7` | `rgba(255,255,255,0.14)` | Inactive chip border |

### Dark compositing overlays

| Token | Value | Use for |
|---|---|---|
| `C.OVERLAY_1` | `rgba(0,0,0,0.28)` | Panel bg tint |
| `C.OVERLAY_2` | `rgba(0,0,0,0.35)` | Slot / card base |
| `C.OVERLAY_3` | `rgba(0,0,0,0.55)` | Badge bg |
| `C.OVERLAY_4` | `rgba(0,0,0,0.60)` | Full-coverage dimmer |

### Text (white-on-dark)

| Token | Value | Use for |
|---|---|---|
| `C.TEXT` | `#F0EAFF` | Primary text (light lavender-white) |
| `C.TEXT_SOFT` | `#C4B5FD` | Secondary text |
| `C.TEXT_MUTED` | `#8B7EC8` | Muted / label text |
| `C.TEXT_DISABLED` | `#453870` | Disabled / placeholder |
| `C.TEXT_ON_DARK_DIM` | `rgba(255,255,255,0.30)` | De-emphasised labels |
| `C.TEXT_ON_DARK_MUTED` | `rgba(255,255,255,0.45)` | Secondary / subtitles |
| `C.TEXT_ON_DARK_SOFT` | `rgba(255,255,255,0.52)` | Medium-visibility text |
| `C.TEXT_ON_DARK` | `rgba(255,255,255,0.70)` | Standard visible text |

### Accent colors

| Token | Value | Use for |
|---|---|---|
| `C.PRIMARY` | `#7C3AED` | Purple – main accent |
| `C.PRIMARY_DARK` | `#5B21B6` | Darker purple |
| `C.PRIMARY_LIGHT` | `#A78BFA` | Lighter purple tint |
| `C.PRIMARY_GLOW` | `rgba(124,58,237,0.12)` | Purple ambient glow |
| `C.SECONDARY` | `#DB2777` | Hot pink |
| `C.SECONDARY_DARK` | `#9D174D` | Darker hot pink |
| `C.SECONDARY_LIGHT` | `#FBCFE8` | Light pink tint |
| `C.SECONDARY_GLOW` | `rgba(219,39,119,0.12)` | Pink ambient glow |
| `C.CYAN` | `#0891B2` | Cyan accent |
| `C.CYAN_GLOW` | `rgba(8,145,178,0.12)` | Cyan ambient glow |
| `C.GOLD` | `#D97706` | Gold / currency |
| `C.GOLD_DARK` | `#92400E` | Darker gold |
| `C.GOLD_GLOW` | `rgba(217,119,6,0.12)` | Gold ambient glow |

### Sovereign tier (special)

| Token | Value | Use for |
|---|---|---|
| `C.SOVEREIGN_GOLD` | `#FFD700` | Card border, crown badge, cardId tint |
| `C.SOVEREIGN_AMBER` | `#FFA500` | Bottom gradient warm tint |
| `C.SOVEREIGN_GLOW` | `rgba(255,215,0,0.22)` | Shimmer bar & banner ambient glow |
| `C.SOVEREIGN_SHINE` | `rgba(255,255,180,0.48)` | Shimmer centre highlight peak |

### Stat / status colors

| Token | Value | Use for |
|---|---|---|
| `C.HP` | `#E11D48` | HP stat color |
| `C.ATK` | `#D97706` | ATK stat color |
| `C.DEF` | `#0891B2` | DEF stat color |
| `C.CRIT` | `#7C3AED` | CRIT stat color |
| `C.SUCCESS` | `#059669` | Success / in-team indicator |
| `C.DANGER` | `#DC2626` | Danger / remove actions |
| `C.DANGER_DARK` | `#7F1D1D` | Dark danger bg |
| `C.WARNING` | `#D97706` | Warning / caution |

### Special effects

| Token | Value | Use for |
|---|---|---|
| `C.FLASH_GOLD` | `rgba(255,215,0,0.55)` | S-rank reveal flash |
| `C.FLASH_PURPLE` | `rgba(192,132,252,0.45)` | A-rank reveal flash |
| `C.SHIMMER` | `rgba(255,255,255,0.40)` | Shimmer sweep highlight |
| `C.FLASH_LIGHT` | `#C8D8FF` | Lightning flash overlay (WeatherEffect) |
| `C.THUMB` | `rgba(255,255,255,0.92)` | Slider thumb on dark track |

### Gradients

| Token | Use for |
|---|---|
| `C.GRAD_BG` | Full-screen background gradient |
| `C.GRAD_HEADER` | Top bar / header gradient — always use light text on top |
| `C.GRAD_PINK` | CTA buttons / highlights (purple→pink) |
| `C.GRAD_GOLD` | Gold / currency gradients |
| `C.GRAD_BATTLE` | Battle screen bg |
| `C.GRAD_WIN` | Win result overlay bg |
| `C.GRAD_LOSE` | Lose result overlay bg |
| `C.GRAD_SUMMON` | Summon screen bg |
| `C.GRAD_VOID` | Summon reveal bg (near-black) |
| `C.GRAD_VICTORY` | Victory screen — dark amber |
| `C.GRAD_DEFEAT` | Defeat screen — dark crimson |

---

## Rank Colors

```js
import { RANK } from '../theme/colors';
const r = RANK[hero.rank]; // { bg, text, glow }
```

| Rank | bg | text | glow | Notes |
|---|---|---|---|---|
| `SOVEREIGN` | `#FFD700` | `#1A0A00` | `#FFEC6E` | Special top tier |
| `S` | `#F72585` | `#FFFFFF` | `#FF85C2` | |
| `A` | `#7B2FBE` | `#E9D5FF` | `#C084FC` | |
| `B` | `#0284C7` | `#E0F2FE` | `#7DD3FC` | |
| `C` | `#059669` | `#D1FAE5` | `#6EE7B7` | |

Hierarchy: **SOVEREIGN > S > A > B > C**

---

## Rules

1. All new screens and components **must** import and use `C.*` tokens.
2. When editing existing files that use raw hex values, migrate those values to `C.*` tokens in the same change.
3. Faction-specific colors come from `FACTIONS[hero.faction].color` (defined in `src/data/heroes.js`) — these are intentionally per-faction and are the only exception to the no-raw-hex rule.
4. Do **not** add new color values to individual screen files. If a new token is needed, add it to `src/theme/colors.js` first.
