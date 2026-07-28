import type { MeetingSession } from './types.js';

/** Reads all per-session keys and returns them as a flat array. */
export async function getAllSessions(): Promise<MeetingSession[]> {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith('session:'))
    .map(([, value]) => value as MeetingSession);
}

/** Writes a single session to its own key. */
export async function saveSession(session: MeetingSession): Promise<void> {
  await chrome.storage.local.set({ [`session:${session.id}`]: session });
}

/** Reads one session by id, merges updates, writes back only that key. */
export async function updateSession(
  id: string,
  updates: Partial<MeetingSession>,
): Promise<void> {
  const key = `session:${id}`;
  const stored = await chrome.storage.local.get(key);
  const existing = stored[key] as MeetingSession | undefined;
  if (existing === undefined) return;
  await chrome.storage.local.set({ [key]: { ...existing, ...updates, id: existing.id } });
}
