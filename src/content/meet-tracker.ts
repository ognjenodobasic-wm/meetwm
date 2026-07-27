/**
 * Join/leave detection on meet.google.com — spec §4.
 *
 * Module loading: MV3 content scripts are NOT ES modules. This file must stay a
 * plain script — a top-level `import`/`export` (even a type-only one, which
 * makes tsc emit `export {}`) would make Chrome throw on load. Types therefore
 * come in through inline `import(...)` type positions, which erase completely.
 * Shared helpers are pulled in at runtime:
 *
 *   const { appendSession } = await import(
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

/** The session currently being recorded, if any. */
let activeSession: MeetingSession | null = null;

/**
 * TODO(phase 1): true only while actually in the call — detect a DOM signal
 * such as the "Leave call" button. An open lobby tab is NOT an active session.
 */
function isInCall(): boolean {
  return false;
}

/** TODO(phase 1): meet.google.com/xxx-xxxx-xxx → "xxx-xxxx-xxx". */
function currentMeetingCode(): string | null {
  return null;
}

/** TODO(phase 1): open a session on first "in call" detection and persist it. */
async function handleJoin(): Promise<void> {
  if (activeSession !== null) return;
  const meetingCode = currentMeetingCode();
  if (meetingCode === null) return;
  // TODO: build the MeetingSession and appendSession() it.
}

/**
 * TODO(phase 1): close the session on leave button, tab close, or navigation
 * away. A session that never gets here stays `endTime: null` on purpose —
 * never guess a duration (spec §7).
 */
async function handleLeave(): Promise<void> {
  if (activeSession === null) return;
  // TODO: set endTime and updateSession().
  activeSession = null;
}

/** TODO(phase 1): observe the DOM and drive handleJoin / handleLeave. */
function start(): void {
  if (isInCall()) void handleJoin();
  window.addEventListener('pagehide', () => void handleLeave());
}

start();
