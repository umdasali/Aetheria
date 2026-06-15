Check a file (or files) for bare hex color values that violate the C.* token rule.

Usage:
  /check-colors src/screens/HomeScreen.js
  /check-colors src/screens/         ← scans entire directory
  /check-colors                      ← scans all of src/screens/ and src/components/

Arguments: $ARGUMENTS

Steps:
1. If $ARGUMENTS is a file path, check that single file.
   If $ARGUMENTS is a directory, check all .js files inside it.
   If $ARGUMENTS is empty, check every .js file in src/screens/ and src/components/.

2. For each file, run:
   grep -nE "'#[0-9A-Fa-f]{3,8}'|\"#[0-9A-Fa-f]{3,8}\"|rgba\([0-9 ,./]+\)" <file>
   Skip src/theme/colors.js — it is the allowed source of hex values.

3. For each violation line, show:
   - file:lineNumber  — the exact offending line
   - Suggested replacement using the closest C.* token from src/theme/colors.js

4. End with a summary: X files checked, Y violations found across Z files.
   If zero violations: print a confirmation.

Do not modify any files. Report only.
