Audit all screen and component files in src/ for style violations.

Usage: /audit-style
Arguments: $ARGUMENTS (optional — if provided, restrict audit to that file or directory)

Scope: src/screens/*.js and src/components/*.js (excluding src/theme/colors.js).
If $ARGUMENTS is non-empty, restrict the audit to the specified path.

Run the following checks on every in-scope file:

---

CHECK 1 — Bare hex values
grep -nE "'#[0-9A-Fa-f]{3,8}'|\"#[0-9A-Fa-f]{3,8}\""
Report file:line and suggest the nearest C.* token replacement.

CHECK 2 — Raw rgba() strings
grep -nE "rgba\([[:space:]]*[0-9]"
Any rgba() literal outside src/theme/colors.js is a violation.
Exception: textShadowColor with rgba(0,0,0,...) is allowed only when using the approved text-on-image pattern.

CHECK 3 — Missing C import
Files that use color tokens but don't have: import { C ... } from '../theme/colors'
Flag these.

CHECK 4 — useNativeDriver omitted
grep -nE "Animated\.(timing|spring|decay)\(" — then check if the options object in context contains useNativeDriver.
Flag any call that does NOT have useNativeDriver: true.
(Skip: calls animating width/height/padding/margin — those cannot use native driver.)

CHECK 5 — Portrait assumptions
grep -nE "height.*>.*width|H\s*>\s*W"
Flag any condition that assumes portrait orientation.

CHECK 6 — effectiveRank not used when displaying rank
grep -nE "hero\.rank\b" outside of data files.
Should always be hero.effectiveRank ?? hero.rank when displaying.

---

Output format:

## Audit Report

### CHECK 1: Bare hex values
| File | Line | Violation | Suggested fix |
|------|------|-----------|---------------|
| ...  | ...  | ...       | ...           |

### CHECK 2: Raw rgba() strings
...

[one section per check]

### Summary
| Check | Files with violations | Total violations |
|-------|-----------------------|-----------------|
| Bare hex | N | N |
| Raw rgba | N | N |
| Missing C import | N | N |
| useNativeDriver missing | N | N |
| Portrait assumption | N | N |
| effectiveRank | N | N |

**Top 3 files by violation count:**
1. path/to/file.js — N violations
2. ...

If a check has zero violations, print a single green checkmark line for that check and skip the table.
