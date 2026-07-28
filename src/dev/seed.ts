import { getAllSessions, saveSession } from '../shared/storage.js';
import type { MeetingSession } from '../shared/types.js';

const SESSIONS_KEY = 'sessions';

function dateKeyFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function makeId(): string {
  return crypto.randomUUID();
}

const MEETING_POOL: { meetingCode: string; title: string; projectTag: string }[] = [
  { meetingCode: 'alpha-sync', title: 'Daily Standup', projectTag: 'Ops' },
  { meetingCode: 'client-demo', title: 'Client Demo', projectTag: 'Client' },
  { meetingCode: 'eng-review', title: 'Engineering Review', projectTag: 'Eng' },
  { meetingCode: 'weekly-sync', title: 'Weekly Sync', projectTag: 'Ops' },
  { meetingCode: 'retro-room', title: 'Sprint Retrospective', projectTag: 'Team' },
  { meetingCode: 'roadmap-plan', title: 'Q3 Roadmap Planning: budget, hiring, and scope', projectTag: 'Core' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHistoricalSession(now: Date): MeetingSession {
  const pick = MEETING_POOL[randomInt(0, MEETING_POOL.length - 1)]!;
  const daysAgo = randomInt(1, 90);
  const day = new Date(now);
  day.setDate(now.getDate() - daysAgo);
  day.setHours(randomInt(8, 17), randomInt(0, 59), 0, 0);

  const startTime = day.getTime();
  const durationMs = randomInt(5, 90) * 60_000;
  const endTime = startTime + durationMs;

  return {
    id: makeId(),
    meetingCode: pick.meetingCode,
    title: pick.title,
    projectTag: pick.projectTag,
    startTime,
    endTime,
    dateKey: dateKeyFromDate(day),
  };
}

export async function seedDummyData(): Promise<void> {
  const now = new Date();
  const today = dateKeyFromDate(now);
  const twoDaysAgoDate = new Date(now);
  twoDaysAgoDate.setDate(now.getDate() - 2);
  const twoDaysAgo = dateKeyFromDate(twoDaysAgoDate);

  const sessions: MeetingSession[] = [
    {
      id: makeId(),
      meetingCode: 'alpha-sync',
      title: 'Daily Standup',
      projectTag: 'Ops',
      startTime: new Date(`${today}T08:30:00.000Z`).getTime(),
      endTime: new Date(`${today}T09:00:00.000Z`).getTime(),
      dateKey: today,
    },
    {
      id: makeId(),
      meetingCode: 'alpha-sync',
      title: 'Sprint Planning: API and tracking updates',
      projectTag: 'Core',
      startTime: new Date(`${today}T10:00:00.000Z`).getTime(),
      endTime: new Date(`${today}T11:15:00.000Z`).getTime(),
      dateKey: today,
    },
    {
      id: makeId(),
      meetingCode: 'client-demo',
      title: 'Client Demo',
      projectTag: 'Client',
      startTime: new Date(`${today}T12:00:00.000Z`).getTime(),
      endTime: new Date(`${today}T12:40:00.000Z`).getTime(),
      dateKey: today,
    },
    {
      id: makeId(),
      meetingCode: 'eng-review',
      title: 'Very long engineering review title for layout checks',
      projectTag: 'Eng',
      startTime: new Date(`${today}T14:00:00.000Z`).getTime(),
      endTime: new Date(`${today}T15:00:00.000Z`).getTime(),
      dateKey: today,
    },
    {
      id: makeId(),
      meetingCode: 'eng-review',
      title: 'In progress check-in',
      projectTag: 'Eng',
      startTime: new Date(`${today}T16:30:00.000Z`).getTime(),
      endTime: null,
      dateKey: today,
    },
    {
      id: makeId(),
      meetingCode: 'weekly-sync',
      title: 'Weekly sync',
      projectTag: 'Ops',
      startTime: new Date(`${twoDaysAgo}T09:00:00.000Z`).getTime(),
      endTime: new Date(`${twoDaysAgo}T09:45:00.000Z`).getTime(),
      dateKey: twoDaysAgo,
    },
    {
      id: makeId(),
      meetingCode: 'client-demo',
      title: 'Follow-up',
      projectTag: 'Client',
      startTime: new Date(`${twoDaysAgo}T11:00:00.000Z`).getTime(),
      endTime: new Date(`${twoDaysAgo}T11:30:00.000Z`).getTime(),
      dateKey: twoDaysAgo,
    },
    {
      id: makeId(),
      meetingCode: 'retro-room',
      title: 'Unfinished retrospective',
      projectTag: 'Team',
      startTime: new Date(`${twoDaysAgo}T17:00:00.000Z`).getTime(),
      endTime: null,
      dateKey: twoDaysAgo,
    },
  ];

  for (let i = 0; i < 100; i++) {
    sessions.push(randomHistoricalSession(now));
  }

  const existing = await getAllSessions();
  if (existing.length > 0) {
    await chrome.storage.local.remove(SESSIONS_KEY);
  }

  for (const session of sessions) {
    await saveSession(session);
  }
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.remove(SESSIONS_KEY);
}
