---
name: eod
description: End-of-day wrap-up for MeetWM — review the day's changes, update CHANGELOG.md, typecheck, commit, push. Use when the user says /eod, "wrap up", or "end of day".
---

# /eod — end of day

Mikro tier: the CHANGELOG entry **is** the state-of-the-project record. There is no
ROADMAP to update.

## 1. Review what changed

```bash
git log --oneline -20
git status --short
git diff --stat
```

Read the actual diff of anything you did not write yourself this session. If there
is nothing uncommitted and no new commits since the last CHANGELOG entry, say so
and stop — do not invent an entry.

## 2. Update CHANGELOG.md

Add one dated entry at the top, under the header, newest first:

```markdown
## [0.1.0] — 2026-07-27

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

Only include sections that have content. Write what changed for the user of the
extension, not a list of touched files. Bump the version in `manifest.json` and
`package.json` together if this wraps a releasable change — they must stay equal.

## 3. Typecheck

```bash
npm run typecheck
```

Must be clean. If it errors, report every error with file and line and stop — do
not commit a broken tree.

## 4. Commit

```bash
git add -A
git commit
```

Conventional-commit subject (`feat:`, `fix:`, `chore:`, `docs:`). One commit for
the day's work unless the changes are genuinely unrelated.

## 5. Push

```bash
git push
```

If no remote is configured yet, say so and stop — do not add one.

## Report back

- What changed today (2–4 lines)
- CHANGELOG entry added: yes/no
- Typecheck: clean / N errors
- Commit hash + subject
- Pushed: yes/no
- Anything left half-done that tomorrow needs to pick up
