---
project: MeetWM
state: active
phase: "Faza 1 završena (spec §6); Faza 2 nije započeta"
last_done: "docs: update CLAUDE.md for docs/ path and v1.3 endTime split (3850b59)"
next_step: "Odlučiti da li se kreće Faza 2 (Google Calendar integracija / cross-device sync) — vidi spec §9 Otvorena pitanja"
blocked_by: ""
updated: 2026-11-15
---

## Sada

- Grana: `main`.
- Fajl: `docs/MEETWM-SPEC-v1.3.md` je autoritativni spec; `CHANGELOG.md` je status log.
- Faza 1 (spec §6 Feature Map) je kompletna — svih 6 Faza-1 feature-a je "Za build" status u tabeli,
  a CHANGELOG bilježi implementaciju (join/leave detekcija, storage, popup, history, export, flagging).
- Poslednji commit: `3850b59` — docs: update CLAUDE.md for docs/ path i v1.3 endTime split.
- Faza 2/3 (Calendar integracija, cross-device sync, Tempo API push) su backlog, nije započeto.
- Sledeći konkretan korak: pregledati spec §9 Otvorena pitanja i odlučiti da li se kreće Faza 2.

## Sledeće

- Faza 2 (backlog, spec §6): Google Calendar integracija (auto-naslov, auto-tag).
- Faza 2 (backlog, opciono): cross-device sync preko Supabase — samo ako se pokaže potreba.

## Kasnije

- Faza 3 (backlog, spec §6): Tempo API direktan push — zavisi od devops pristupa Tempo API-ju.
