/**
 * Core data model — spec §3.
 *
 * One join→leave cycle is always one row. Never pre-aggregate, never auto-merge
 * repeated `meetingCode` values in storage: a fixed team link is legitimately
 * reused for different meetings on the same day. Grouping happens in the view
 * layer only (see `grouping.ts`).
 */
export interface MeetingSession {
  /** Stable id (uuid or timestamp-based). */
  id: string;
  /** From the URL: meet.google.com/xxx-xxxx-xxx → "xxx-xxxx-xxx". */
  meetingCode: string;
  /** Epoch ms. */
  startTime: number;
  /** Epoch ms, or null when the session was never closed cleanly (crash / force quit). */
  endTime: number | null;
  /** "YYYY-MM-DD", derived from `startTime`, for fast per-day filtering. */
  dateKey: string;
  /** Optional, manually entered name (tab title fallback if available). */
  title: string | null;
  /** Optional, for future Tempo mapping. Not required in phase 1. */
  projectTag: string | null;
}

/** Fields a user may edit by hand in the history view. */
export type EditableSessionFields = Pick<
  MeetingSession,
  'startTime' | 'endTime' | 'title' | 'projectTag'
>;
