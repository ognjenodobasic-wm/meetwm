# Changelog

All notable changes to MeetWM.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## 28. jul 2026.

- Task #1 (`0a5331b`), Task #2 (`d5c7bf9`), Task #3 (`d41092f`).
- Task #4 (`9b582e9`), Task #5 (`d900605`), Task #6 (`9162637`).
- Task #7 (`d0132ff`), Task #8 (`79bc66d`).

## 27. jul 2026.

### Added
- Session persistence in `chrome.storage.local` as a flat, per-session log.
- Join/leave detection on Google Meet via a `MutationObserver` watching for an
  aria-label "leave call" button.
- Shared grouping and formatting (`groupSessionsByCode`) used by both UI
  surfaces: the "u toku" / "nezavršeno" distinction for unfinished sessions,
  `Xh Ym` display duration, and decimal-hours export duration.
- Popup UI: today's accordion grouped by meeting, exclusive open/close state,
  footer with running total.
- History page: day/week/month filters, inline per-session editing, and
  clipboard CSV export.

Phase 1 (feature map §6) is complete.
