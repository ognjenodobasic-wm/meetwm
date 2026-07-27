import type { MeetingSession } from './types.js';

/**
 * Grouping + duration formatting — spec §3 and §5.
 *
 * Single source of truth: popup.ts and history.ts both import from here.
 * Neither surface may reimplement grouping or formatting on its own.
 */

/**
 * `endTime: null` splits into two display states depending on `dateKey`
 * (spec v1.3 §3):
 * - `'in-progress'` — started today, still open; treated as an active call.
 * - `'incomplete'` — `dateKey` is not today; the call was left open
 *   (crash/force quit) and needs a manual fix.
 * Completed sessions (`endTime !== null`) are `'completed'`. The distinction is
 * display-only — storage never changes based on it.
 */
export type SessionStatus = 'completed' | 'in-progress' | 'incomplete';

export interface SessionWithStatus {
  session: MeetingSession;
  status: SessionStatus;
}

/** One accordion row: a `meetingCode` plus every session recorded under it. */
export interface GroupedMeeting {
  meetingCode: string;
  /** Most recent session's non-null title in the group, else `meetingCode`. */
  title: string;
  sessionCount: number;
  /** Chronological, oldest first. */
  sessions: SessionWithStatus[];
  /** `Xh Ym` (e.g. `1h 27m`, or `32m` under an hour), from completed sessions only. */
  uiLabel: string;
  /** Decimal hours rounded to 2 decimals, from completed sessions only. */
  decimalHours: number;
}

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function statusFor(session: MeetingSession, todayKey: string): SessionStatus {
  if (session.endTime !== null) return 'completed';
  return session.dateKey === todayKey ? 'in-progress' : 'incomplete';
}

/** `Xh Ym` (e.g. `1h 27m`, or `32m` under an hour). */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`;
}

function formatDecimalHours(totalMs: number): number {
  return Math.round((totalMs / 3_600_000) * 100) / 100;
}

/** Groups a flat session list by `meetingCode` for display. Never mutates input. */
export function groupSessionsByCode(sessions: MeetingSession[]): GroupedMeeting[] {
  const todayKey = todayDateKey();
  const order: string[] = [];
  const byCode = new Map<string, MeetingSession[]>();

  for (const session of sessions) {
    const existing = byCode.get(session.meetingCode);
    if (existing === undefined) {
      order.push(session.meetingCode);
      byCode.set(session.meetingCode, [session]);
    } else {
      existing.push(session);
    }
  }

  return order.map((meetingCode) => {
    const group = [...(byCode.get(meetingCode) ?? [])].sort(
      (a, b) => a.startTime - b.startTime,
    );
    const completedMs = group
      .filter((session) => session.endTime !== null)
      .reduce((sum, session) => sum + (session.endTime! - session.startTime), 0);

    return {
      meetingCode,
      title:
        [...group].reverse().find((session) => session.title !== null)?.title ??
        meetingCode,
      sessionCount: group.length,
      sessions: group.map((session) => ({
        session,
        status: statusFor(session, todayKey),
      })),
      uiLabel: formatDuration(completedMs),
      decimalHours: formatDecimalHours(completedMs),
    };
  });
}
