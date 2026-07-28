Task: Bootstrap new Chrome extension project — MeetWM
Version: v1.1 | Date: 27 Jul 2026
Tier: Mikro (per project-setup-standard v1.1 — internal single-purpose extension, no backend)

Context:
This is a Chrome Manifest V3 extension. It tracks the user's own join/leave times on
Google Meet calls via a content script, stores sessions locally, and shows them in a
popup + a full-page history view. No backend, no auth, no bundler. Full spec is in
MEETWM-SPEC-v1.1.md (paste alongside this prompt) — read it before writing any code.

Constraints:
- Vanilla TypeScript only — no React, no framework
- No bundler — compile with plain `tsc`, manifest points directly at compiled dist/*.js
- No npm dependencies beyond `@types/chrome` and `typescript` as devDependencies
- Mikro tier only: create CLAUDE.md and CHANGELOG.md — do NOT create ROADMAP.md,
  LESSONS.md, BUGS.md, ARCHITECTURE.md, or any .claude/agents/ files

Steps:
1. `git init`, `.gitignore` (node_modules, dist)
2. `package.json` (name: "meetwm") + `tsconfig.json` (strict: true, no bundler config)
3. `manifest.json` (Manifest V3):
   - name: "MeetWM"
   - permissions: ["storage", "activeTab"]
   - content_scripts matching "*://meet.google.com/*"
   - action (popup) pointing to popup.html
   - no background service worker unless you determine one is structurally required
4. Folder skeleton:
   - src/content/meet-tracker.ts       (join/leave detection)
   - src/popup/popup.ts + popup.html + popup.css
   - src/history/history.ts + history.html
   - src/shared/types.ts               (MeetingSession interface, per spec §3)
   - src/shared/storage.ts             (chrome.storage.local read/write helpers)
   - src/shared/grouping.ts            (shared grouping/formatting logic used by
     both popup and history — this must NOT be duplicated between the two)
5. Empty `CHANGELOG.md` (header only, no entries yet)
6. Run `/init`, then aggressively trim the generated CLAUDE.md down to project facts
   only (build/typecheck commands, manifest constraints, the "no React / no bundler"
   rule, the "grouping logic lives in src/shared/, never duplicated" rule).
   Target: under 100 lines — this is a Mikro-tier project, keep it lean.
7. `ln -s CLAUDE.md AGENTS.md`
8. Create `.claude/skills/eod/SKILL.md` — standard /eod procedure (per
   project-setup-standard §5): git log + status, update CHANGELOG.md, typecheck,
   commit, push. Mikro tier does not need ROADMAP "Sada" section — CHANGELOG entry
   is the state-of-the-project record for this project.
9. Create `.claude/settings.json` with `"autoMemoryEnabled": false` and a hook that
   runs `tsc --noEmit` before any commit is finalized (Mikro tier: typecheck hook
   only, no git-lifecycle hooks needed beyond that).

Typecheck:
Run `npx tsc --noEmit`.
If output is empty: proceed to Commit
If errors: list every error with file + line, then STOP (do not commit)

Commit:
Run `git add -A`, then commit with message `chore: bootstrap project structure`.
Do not push.

Report:
- Status: DONE | STOPPED
- Files created: <list>
- Typecheck: clean | <error count>
- Commit: <hash + message> | none
- Anything from the spec that was ambiguous or required a judgment call: <one
  sentence per item, or "none">

Execution rules:
- Read MEETWM-SPEC-v1.1.md fully before Step 1
- This is a setup-only session — do not implement tracking logic, popup rendering,
  or history view content beyond empty skeleton files with correct exports/types
- Do not run dev server, do not open browser, do not install Chrome
- If manifest.json permissions or content_script matching need something not
  covered in the spec, flag it in the Report rather than guessing
