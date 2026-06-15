Show a complete progression snapshot and roadmap for a hero.

Usage:
  /hero-progress hero_001
  /hero-progress Kira         ← partial name match accepted

Arguments: $ARGUMENTS

Steps:

1. Read src/data/heroes.js to find the hero (by ID or partial name match).
2. The hero's current state in the store is unknown — show the full progression tree assuming starting state (level 1, base rank, 1 copy, 0 transcendences) and annotate each step.

Print the following:

---

## Hero: [Name] ([ID])

**Base stats:**
| Stat | Base | At Rank S (×1.55) | At SOVEREIGN (×1.85) |
|------|------|-------------------|----------------------|
| HP   | X    | X                 | X                    |
| ATK  | X    | X                 | X                    |
| DEF  | X    | X                 | X                    |
| CRIT | X    | X                 | X                    |

**Faction / Element / Effect / Class:** [values]

**Effect mechanic:** [EFFECT → mechanic → what it does in battle]

**Skills:**
- Skill 1: [name] · cost [N energy] · multiplier [D] · [damage or heal?]
- Skill 2: [name] · cost [N energy] · multiplier [D]
- Trump Card: [name] · multiplier [D] · effect: [parsed effect string]

---

## Level-Up Roadmap

| Level | Gold Cost | Total Gold So Far | Max Level If Transcended |
|-------|-----------|-------------------|--------------------------|
| 1→2  | 100       | 100               | base max: 10             |
| 2→3  | 200       | 300               | |
| ...   | ...       | ...               | |
| 9→10 | 900       | 4,500             | |
| 10→11 (needs T1) | 1,200 | — | max: 15 after T1 |
| ...  | ...       | ...               | max: 30 after T4 |
| 29→30| ...       | total: X gold     | |

**L1→L10 total:** X gold
**L1→L30 total (all 4 transcendences unlocked):** X gold

---

## Transcendence Roadmap

| Step | Copies Required | Gold Cost | New Max Level |
|------|----------------|-----------|---------------|
| T1   | 5              | 8,000     | 15            |
| T2   | 5              | 15,000    | 20            |
| T3   | 5              | 25,000    | 25            |
| T4   | 5              | 40,000    | 30            |
| **Total** | **20 copies** | **88,000 gold** | **L30** |

---

## Fusion Roadmap

(Only if base rank is C, B, or A — SOVEREIGN heroes cannot be fused)

| Step | Copies Required | Gold Cost | New Rank |
|------|----------------|-----------|----------|
| C→B  | 3              | 2,000     | B        |
| B→A  | 3              | 5,000     | A        |
| A→S  | 3              | 10,000    | S        |
| **Total** | **9 copies** | **17,000 gold** | **S** |

---

## Full Progression Summary

| Goal | Copies Needed (beyond 1) | Gold Needed |
|------|--------------------------|-------------|
| L10 only | 0 | 4,500 |
| L10 + S rank | 8 | 21,500 |
| L30 + S rank | 28 | 105,500 |

---

## Verdict

In 1–2 sentences: is this hero a priority investment? Is their effect/class complementary to common team compositions?
