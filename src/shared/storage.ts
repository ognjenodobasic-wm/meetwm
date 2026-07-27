import type { MeetingSession } from './types.js';

/** Single `chrome.storage.local` key holding the flat session log. */
export const SESSIONS_KEY = 'sessions';

/** Reads the whole flat log. Returns `[]` when nothing has been stored yet. */
export async function getAllSessions(): Promise<MeetingSession[]> {
  const stored = await chrome.storage.local.get(SESSIONS_KEY);
  return (stored[SESSIONS_KEY] as MeetingSession[] | undefined) ?? [];
}

/** Appends one session and persists the full array back to storage. */
export async function saveSession(session: MeetingSession): Promise<void> {
  const sessions = await getAllSessions();
  sessions.push(session);
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions });
}

/** Finds a session by id and merges the updates (manual correction path, spec §5). */
export async function updateSession(
  id: string,
  updates: Partial<MeetingSession>,
): Promise<void> {
  const sessions = await getAllSessions();
  const index = sessions.findIndex((session) => session.id === id);
  const existing = sessions[index];
  if (existing === undefined) return;
  sessions[index] = { ...existing, ...updates, id: existing.id };
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions });
}
