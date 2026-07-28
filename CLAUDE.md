# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MeetWM — Chrome Manifest V3 extension that logs the user's own join/leave times on
Google Meet calls to `chrome.storage.local`, and shows them in a toolbar popup
(today) and a full-page history view (day/week/month, manual edits, export).

Authoritative spec: `MEETWM-SPEC-v1.1.md`. Read it before changing behaviour —
section refs (§3 data model, §4 detection, §5 UI, §7 decisions) are cited in code
comments. No backend, no auth, single user, local only.

## Commands

```bash
npm run build      # tsc → dist/
npm run watch      # tsc --watch
npm run typecheck  # tsc --noEmit  (must be clean before any commit)
```

No test suite and no dev server. To try it: `npm run build`, then load the repo
root as an unpacked extension in `chrome://extensions`. Distribution is unpacked
from GitHub with a manual reload — there is no Web Store release.

## Hard constraints

- **Vanilla TypeScript only.** No React, no framework, no UI library.
- **System font stack only.** No `@font-face`, no Google Fonts or other font
  loading, no bundled font files — use the OS default via CSS (e.g.
  `font-family: system-ui, sans-serif`).
- **No bundler.** Plain `tsc`; `manifest.json` points directly at `dist/*.js`.
- **No runtime npm dependencies.** Only `typescript` and `@types/chrome` as
  devDependencies. Adding one reopens the no-bundler decision (spec §7).
- `strict: true` stays on.
- Mikro tier: only `CLAUDE.md` and `CHANGELOG.md`. Do not add `ROADMAP.md`,
  `LESSONS.md`, `BUGS.md`, `ARCHITECTURE.md`, or `.claude/agents/`.

## Layout

| Path | Role |
|---|---|
| `src/shared/types.ts` | `MeetingSession` (spec §3) |
| `src/shared/storage.ts` | `chrome.storage.local` read/write helpers |
| `src/shared/grouping.ts` | grouping + duration formatting |
| `src/content/meet-tracker.ts` | join/leave detection on meet.google.com |
| `src/popup/` | popup UI (`popup.html` + `popup.css` + `popup.ts`) |
| `src/history/` | history page (reuses `src/popup/popup.css`) |

HTML/CSS stay in `src/` and are referenced from there by `manifest.json`; only
compiled JS lives in `dist/` (gitignored). HTML loads its script with
`src="../../dist/<area>/<file>.js"` — keep those relative paths in sync if files
move.

## Rules that are easy to break

**Grouping and formatting live in `src/shared/grouping.ts`, and nowhere else.**
Popup and history both import from it. A second copy of grouping or duration
formatting in either surface is a defect, not a shortcut.

**Storage is a flat log.** One join→leave cycle is one row, always. Never merge
repeated `meetingCode` rows in storage — a fixed team link is legitimately reused
for different meetings the same day. Grouping is view-layer only.

**Never guess a duration.** `endTime: null` means the session was never closed
cleanly; show it flagged and let the user fix it. Duration is never stored — it is
computed from `startTime`/`endTime` at display time, `H:MM` for the UI and decimal
hours for export.

**The content script is not an ES module.** MV3 content scripts load as classic
scripts, so `src/content/meet-tracker.ts` must emit no top-level `import`/`export`
— even `import type` makes tsc emit `export {}`, which throws on load. Use inline
`import('...')` type positions instead, and pull shared code in at runtime via
`await import(chrome.runtime.getURL('dist/shared/storage.js'))`. That is what the
`web_accessible_resources` entry in `manifest.json` is for. Extension pages
(popup, history) are real modules and import normally.

**Meet's DOM is not a contract** (spec §7). Detection selectors will break on a
Google UI change with no warning; keep the detection surface small and isolated in
`meet-tracker.ts`.

`src/dev/seed.html` + `seed.ts` is a dev-only utility to seed/clear example sessions in `chrome.storage.local` — not linked from `manifest.json`, not a production surface, opened manually via `chrome-extension://<id>/dev/seed.html`.

## Permissions

`storage` + `activeTab` only. The broader `tabs` permission is not needed — the
content script matches `*://meet.google.com/*` directly. Do not widen permissions
without a matching spec update.
