/**
 * Join/leave detection on meet.google.com — spec §4.
 *
 * Module loading: MV3 content scripts are NOT ES modules. This file must stay a
 * plain script — a top-level `import`/`export` (even a type-only one, which
 * makes tsc emit `export {}`) would make Chrome throw on load. Types therefore
 * come in through inline `import(...)` type positions, which erase completely.
 * Shared helpers are pulled in at runtime:
 *
 *   const { saveSession } = await import(
 *     chrome.runtime.getURL('dist/shared/storage.js')
 *   );
 *
 * That is what `web_accessible_resources` in manifest.json exists for. Do not
 * copy storage or grouping logic into this file.
 *
 * Known risk (spec §7): Meet's DOM is not a stable contract. Whatever signal
 * `isInCall()` ends up using needs re-checking after Google UI changes.
 */

type MeetingSession = import('../shared/types.js').MeetingSession;

const storageUrl = chrome.runtime.getURL('dist/shared/storage.js');

/** The session currently being recorded, if any. */
let activeSession: MeetingSession | null = null;
let wasInCall = false;

/** True only while the "Leave call" button is present in the DOM. */
function isInCall(): boolean {
  for (const btn of document.querySelectorAll('button')) {
    const label = btn.getAttribute('aria-label');
    if (label && label.toLowerCase().includes('leave call')) {
      return true;
    }
  }
  return false;
}

/** meet.google.com/xxx-xxxx-xxx → "xxx-xxxx-xxx". */
function currentMeetingCode(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] || null;
}

/** "YYYY-MM-DD" in local time, for `MeetingSession.dateKey`. */
function dateKeyFor(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Open a session on first "in call" detection and persist it. */
async function handleJoin(): Promise<void> {
  if (activeSession !== null) return;
  const meetingCode = currentMeetingCode();
  if (meetingCode === null) return;

  const { saveSession } = await import(storageUrl);
  const now = Date.now();

  const session: MeetingSession = {
    id: makeId(),
    meetingCode,
    startTime: now,
    endTime: null,
    dateKey: dateKeyFor(now),
    title: document.title || null,
    projectTag: null,
  };

  activeSession = session;
  await saveSession(session);
}

/** Close the session on leave button, tab close, or navigation away. */
async function handleLeave(): Promise<void> {
  if (activeSession === null) return;
  const { updateSession } = await import(storageUrl);
  await updateSession(activeSession.id, { endTime: Date.now() });
  activeSession = null;
}

function checkState(): void {
  const inCall = isInCall();
  if (!wasInCall && inCall) {
    void handleJoin();
  } else if (wasInCall && !inCall) {
    void handleLeave();
  }
  wasInCall = inCall;
}

/** Observe the DOM and drive handleJoin / handleLeave. */
function start(): void {
  checkState();
  const observer = new MutationObserver(() => checkState());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => void handleLeave());
}

start();
