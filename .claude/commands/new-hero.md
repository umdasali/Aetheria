Scaffold a new hero entry and add it to src/data/heroes.js.

Usage:
  /new-hero
  /new-hero name:"Seraphina Voss" faction:SUNSPIRE rank:S class:Support

Arguments: $ARGUMENTS

Steps:

1. Read src/data/heroes.js to find:
   - The last hero ID number (e.g. hero_053 → next is hero_054)
   - Existing hero IDs, names, and cardIds to avoid collisions
   - The faction abbreviation codes (EMB, GLA, SUN, VER, VOI)

2. Parse any provided values from $ARGUMENTS. For any not provided, ask before generating:
   - name, faction (EMBERVEIL/GLACIARA/SUNSPIRE/VERDANIA/VOIDMARK)
   - rank (C/B/A/S), class (Attacker/Defender/Mage/Support)
   - element (Fire/Ice/Lightning/Wind/Nature/Void/Holy/Physical)
   - effect (must be from the EFFECT_MECHANICS map in battleEngine.js)

3. Generate stat ranges by rank and class using these guidelines:
   | Rank | HP range | ATK range | DEF range | CRIT range |
   |------|----------|-----------|-----------|------------|
   | C    | 2800–3800 | 260–360 | 150–220 | 170–250 |
   | B    | 3600–5200 | 340–480 | 210–320 | 240–360 |
   | A    | 4800–6800 | 460–640 | 300–460 | 330–520 |
   | S    | 6200–8000 | 620–840 | 450–640 | 500–700 |

   Attacker: high ATK/CRIT, lower DEF/HP
   Defender: high HP/DEF, lower ATK/CRIT
   Mage: high ATK/CRIT, low DEF
   Support: moderate all, slightly higher HP

4. Generate skill entries. Skill cost is the raw multiplier (actual energy = cost × 20):
   - skill[0]: light skill, cost 1–2 (20–40 energy), damage multiplier 1.0–1.8
   - skill[1]: heavy skill, cost 2–3 (40–60 energy), damage multiplier 1.8–2.8
   - Either skill can be a heal (damage: 0) — appropriate for Support class

5. Generate a Trump Card (damage multiplier 2.5–4.0, hits all enemies).

6. Generate:
   - cardId: [FACTION_ABBREV]-[RANK]-[SHORTNAME] (e.g. SUN-S-SERA)
   - about: 1-sentence lore snippet in the style of existing heroes

7. Output the complete hero object as a JS block ready to paste into heroes.js:

```js
{
  id: 'hero_0XX',
  name: '...',
  frame: '...',           // class flavor title (e.g. DAWNBRINGER, VOIDHUNTER)
  faction: '...',
  rank: '...',
  element: '...',
  effect: '...',
  class: '...',
  cardId: '...',
  image: require('../../assets/heroes/hero_0XX.png'),
  about: '...',
  hp: XXXX,
  atk: XXX,
  def: XXX,
  crit: XXX,
  skills: [
    { name: '...', cost: X, description: '...', damage: X.X },
    { name: '...', cost: X, description: '...', damage: X.X },
  ],
  trumpCard: { name: '...', description: '...', damage: X.X, effect: '...' },
},
```

8. Confirm with the user before modifying heroes.js. Once confirmed, insert the new hero object into the HEROES array (before the closing `]`) and add a corresponding entry to FACTIONS if it's a new faction (it won't be — the 5 factions are fixed).

9. Remind the user to add the hero portrait image at the required path: `assets/heroes/hero_0XX.png`
