import type { MeetingSession } from './types.js';

/**
 * Grouping + duration formatting — spec §3 and §5.
 *
 * This module is the ONLY place this logic may live. Popup and history both
 * import from here; neither is allowed to grow its own copy.
 */

/** One accordion row: a `meetingCode` plus every session recorded under it. */
export interface SessionGroup {
  meetingCode: string;
  /** First non-null title found in the group, otherwise null. */
  title: string | null;
  /** Chronological, oldest first. */
  sessions: MeetingSession[];
  /** Sum of finished sessions only. */
  totalMs: number;
  /** True when at least one session has `endTime === null`. */
  hasUnfinished: boolean;
}

/** "YYYY-MM-DD" in local time, for `MeetingSession.dateKey`. */
export function dateKeyFor(_timestamp: number): string {
  throw new Error('dateKeyFor: not implemented');
}

/** Duration of a single session, or null when it was never closed. */
export function sessionDurationMs(_session: MeetingSession): number | null {
  throw new Error('sessionDurationMs: not implemented');
}

/** Default UI format, e.g. `1:47`. */
export function formatDurationHM(_ms: number): string {
  throw new Error('formatDurationHM: not implemented');
}

/** Export/copy format Tempo expects, e.g. `1.25`. */
export function formatDurationDecimal(_ms: number): string {
  throw new Error('formatDurationDecimal: not implemented');
}

/** Groups a flat session list by `meetingCode` for display. Never mutates input. */
export function groupSessions(_sessions: MeetingSession[]): SessionGroup[] {
  throw new Error('groupSessions: not implemented');
}

/** Filters the flat log to a period before grouping. */
export function filterByRange(
  _sessions: MeetingSession[],
  _fromInclusive: number,
  _toExclusive: number,
): MeetingSession[] {
  throw new Error('filterByRange: not implemented');
}
