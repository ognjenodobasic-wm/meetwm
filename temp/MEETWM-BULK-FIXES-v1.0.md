Bulk fixes — MeetWM code review findings
Verzija: v1.0 | Datum: 28. jul 2026.

Order: execute in listed order. Stop and report after EACH task, wait for confirmation before continuing to the next.

---

Task #1: Fix "Clear all data" and reseed to actually remove all session records
File: src/dev/seed.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Update the clear-all-data function to enumerate and remove every chrome.storage.local key matching the `session:` prefix (currently it only removes the unused `sessions` key, so sessions persist across clears)
2. Confirm re-seeding after clear produces exactly the expected number of rows, with no leftover rows from before the clear

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #2: Reliable session close on tab/document close
File: src/content/meet-tracker.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Replace the current beforeunload-only async save with a pattern that survives abrupt document termination (e.g. visibilitychange + pagehide as earlier/redundant save points, keeping storage writes as synchronous as the API allows), so endTime is reliably persisted when the tab/browser closes
2. Confirm the existing "Leave call button clicked" closing path still works unchanged

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #3: Fix week-filter DST boundary bug
File: src/history/history.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Replace the end-of-week calculation (currently `start + 6 × 24h` in epoch ms) with local calendar date arithmetic, e.g. `setDate(monday.getDate() + 6)`, so week boundaries stay correct across DST transitions

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #4: Validate manual session edit endTime
File: src/history/history.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Add validation on manual session edit: entered endTime must be after startTime
2. Block save and show an inline validation message when the check fails

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #5: Fix CSV export escaping
File: src/history/history.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Implement RFC 4180-style field escaping in the CSV export function: wrap any field containing a comma, quote, or newline in quotes, and double internal quotes

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #6: Switch call-state detection to a language-neutral DOM signal
File: src/content/meet-tracker.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Replace the "Leave call" text match as the primary in-call signal with a language-neutral signal (aria-label pattern, data-tooltip-id, or icon/class-based selector) that does not depend on UI language
2. Keep the current text-based match as a secondary fallback check, not the sole method
3. If no sufficiently stable language-neutral signal can be identified with confidence, do not guess — flag it in the Report instead

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #7: Fix seed dateKey to use local date instead of UTC
File: src/dev/seed.ts

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Change dateKey generation in the dev seed script to use the same local-date derivation used elsewhere in the app, instead of UTC

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `fix: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes

---

Task #8: Sync CLAUDE.md with current project state
File: CLAUDE.md

Constraints:
- max 3 bullets
- no refactor beyond task scope
- minimal diff only

Steps:
1. Update version reference from v1.1 to v1.3
2. Update duration format documentation from `H:MM` to `Xh Ym`
3. Add `notifications` to the documented manifest permissions list (currently only lists storage + activeTab)

Typecheck:
Run the project's typecheck/build command.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with a descriptive message: `docs: <what>`. Do not push.

Report:
- Status: DONE | STOPPED
- Files changed: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Blockers: <one sentence> | none

Execution rules:
- Start immediately with Step 1
- One task = one file, do not expand scope
- If a referenced file or path does not exist: STOP and report. Do not create it, do not substitute a similar file.
- No comments unless required, no alternatives, no edge cases unless asked
- Do not run dev server, do not open browser, do not kill processes
