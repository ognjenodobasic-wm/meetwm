import { getAllSessions, saveSession } from '../shared/storage.js';
import type { MeetingSession } from '../shared/types.js';

const SESSIONS_KEY = 'sessions';

function dateKeyFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function makeId(): string {
  return crypto.randomUUID();
}

async function seedDummyData(): Promise<void> {
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

  const existing = await getAllSessions();
  if (existing.length > 0) {
    await chrome.storage.local.remove(SESSIONS_KEY);
  }

  for (const session of sessions) {
    await saveSession(session);
  }
}

async function clearAllData(): Promise<void> {
  await chrome.storage.local.remove(SESSIONS_KEY);
}

const statusEl = document.getElementById('status');
const seedBtn = document.getElementById('seed-btn');
const clearBtn = document.getElementById('clear-btn');

if (
  statusEl instanceof HTMLParagraphElement &&
  seedBtn instanceof HTMLButtonElement &&
  clearBtn instanceof HTMLButtonElement
) {
  seedBtn.addEventListener('click', async () => {
    await seedDummyData();
    statusEl.textContent = 'Seeded 8 sessions.';
  });

  clearBtn.addEventListener('click', async () => {
    await clearAllData();
    statusEl.textContent = 'Cleared.';
  });
}
