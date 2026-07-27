import type { MeetingSession } from './types.js';

/** Single `chrome.storage.local` key holding the flat session log. */
export const SESSIONS_KEY = 'sessions';

/** Reads the whole flat log. Returns `[]` when nothing has been stored yet. */
export async function readSessions(): Promise<MeetingSession[]> {
  const stored = await chrome.storage.local.get(SESSIONS_KEY);
  return (stored[SESSIONS_KEY] as MeetingSession[] | undefined) ?? [];
}

/** Overwrites the whole flat log. */
export async function writeSessions(sessions: MeetingSession[]): Promise<void> {
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions });
}

/** Appends one session. */
export async function appendSession(session: MeetingSession): Promise<void> {
  const sessions = await readSessions();
  sessions.push(session);
  await writeSessions(sessions);
}

/** Patches one session by id. No-op when the id is unknown. */
export async function updateSession(
  id: string,
  patch: Partial<MeetingSession>,
): Promise<void> {
  const sessions = await readSessions();
  const index = sessions.findIndex((session) => session.id === id);
  const existing = sessions[index];
  if (existing === undefined) return;
  sessions[index] = { ...existing, ...patch, id: existing.id };
  await writeSessions(sessions);
}

/** Removes one session by id. */
export async function deleteSession(id: string): Promise<void> {
  const sessions = await readSessions();
  await writeSessions(sessions.filter((session) => session.id !== id));
}
