import {
  groupSessionsByCode,
  formatDuration,
  type GroupedMeeting,
} from '../shared/grouping.js';
import { clearAllData, seedDummyData } from '../dev/seed.js';
import { getAllSessions, getNotificationsEnabled, setNotificationsEnabled } from '../shared/storage.js';

/**
 * Toolbar popup — spec §5. Today only, accordion grouped by `meetingCode`.
 *
 * Grouping and duration formatting come from `../shared/grouping.js`. The popup
 * holds rendering only — no second copy of that logic.
 */

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'avg', 'sep', 'okt', 'nov', 'dec',
];

let openMeetingCode: string | null = null;

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHeaderDate(): string {
  const now = new Date();
  return `${now.getDate()}. ${MONTHS[now.getMonth()]} ${now.getFullYear()}.`;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function groupWarningLabel(group: GroupedMeeting): string | null {
  if (group.sessions.some((s) => s.status === 'in-progress')) return 'u toku';
  if (group.sessions.some((s) => s.status === 'incomplete')) return 'nezavršeno';
  return null;
}

function totalCompletedMs(groups: GroupedMeeting[]): number {
  return groups
    .flatMap((group) => group.sessions)
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.session.endTime! - s.session.startTime), 0);
}

function renderHeader(): HTMLElement {
  const header = document.createElement('div');
  header.className = 'header';

  const left = document.createElement('div');
  const icon = document.createElement('span');
  icon.className = 'header-icon';
  icon.textContent = '🕘';
  const title = document.createElement('strong');
  title.textContent = 'MeetWM';
  left.append(icon, title);

  const right = document.createElement('div');
  right.className = 'header-right';

  const date = document.createElement('span');
  date.className = 'header-date';
  date.textContent = formatHeaderDate();

  const notifToggle = document.createElement('button');
  notifToggle.id = 'notif-toggle';
  notifToggle.className = 'notif-toggle';
  notifToggle.setAttribute('aria-label', 'Toggle notifications');
  notifToggle.textContent = '🔔';

  const devToggle = document.createElement('button');
  devToggle.id = 'dev-toggle';
  devToggle.className = 'dev-toggle';
  devToggle.setAttribute('aria-label', 'Dev tools');
  devToggle.textContent = '⚙';

  right.append(date, notifToggle, devToggle);

  header.append(left, right);
  return header;
}

function renderDevBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = 'dev-bar';
  bar.className = 'dev-bar is-hidden';

  const seedBtn = document.createElement('button');
  seedBtn.id = 'seed-btn';
  seedBtn.textContent = 'Seed dummy data';

  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-btn';
  clearBtn.textContent = 'Clear all data';

  const status = document.createElement('span');
  status.id = 'dev-status';

  bar.append(seedBtn, clearBtn, status);
  return bar;
}

function renderSessionRow(s: GroupedMeeting['sessions'][number]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'session-row';

  const range = document.createElement('span');
  range.textContent =
    s.session.endTime === null
      ? `${formatTime(s.session.startTime)} –`
      : `${formatTime(s.session.startTime)} – ${formatTime(s.session.endTime)}`;

  const right = document.createElement('span');
  if (s.session.endTime === null) {
    right.className = 'session-duration is-warning';
    right.textContent = s.status === 'in-progress' ? 'u toku' : 'nezavršeno';
  } else {
    right.className = 'session-duration';
    right.textContent = formatDuration(s.session.endTime - s.session.startTime);
  }

  row.append(range, right);
  return row;
}

function renderGroup(group: GroupedMeeting): HTMLElement {
  const isOpen = group.meetingCode === openMeetingCode;

  const wrapper = document.createElement('div');
  wrapper.className = isOpen ? 'group is-open' : 'group';

  const row = document.createElement('div');
  row.className = 'group-row';
  row.addEventListener('click', () => {
    openMeetingCode = isOpen ? null : group.meetingCode;
    void renderApp();
  });

  const left = document.createElement('span');
  const chevron = document.createElement('span');
  chevron.className = 'chevron';
  chevron.textContent = isOpen ? '▾' : '▸';
  const title = document.createElement('span');
  title.className = 'group-title';
  title.textContent = group.title;
  left.append(chevron, title);

  const meta = document.createElement('span');
  const warning = groupWarningLabel(group);
  if (warning !== null) {
    meta.className = 'group-meta is-warning';
    meta.textContent = warning;
  } else {
    meta.className = 'group-meta';
    const count = document.createElement('span');
    count.className = 'group-count';
    count.textContent = `(${group.sessionCount})`;
    const time = document.createElement('span');
    time.className = 'group-time';
    time.textContent = group.uiLabel;
    meta.append(count, time);
  }

  row.append(left, meta);
  wrapper.append(row);

  const sessions = document.createElement('div');
  sessions.className = 'sessions';
  for (const s of group.sessions) {
    sessions.append(renderSessionRow(s));
  }
  wrapper.append(sessions);

  return wrapper;
}

function renderFooter(groups: GroupedMeeting[]): HTMLElement {
  const footer = document.createElement('div');
  footer.className = 'footer';

  const link = document.createElement('a');
  link.className = 'footer-link';
  link.href = '#';
  link.textContent = 'više informacija →';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/history/history.html') });
  });

  const total = document.createElement('span');
  total.className = 'footer-total';
  total.textContent = formatDuration(totalCompletedMs(groups));

  footer.append(link, total);
  return footer;
}

function wireDevBar(): void {
  const toggle = document.getElementById('dev-toggle');
  const bar = document.getElementById('dev-bar');
  const seedBtn = document.getElementById('seed-btn');
  const clearBtn = document.getElementById('clear-btn');
  const status = document.getElementById('dev-status');

  if (
    !(toggle instanceof HTMLButtonElement) ||
    !(bar instanceof HTMLDivElement) ||
    !(seedBtn instanceof HTMLButtonElement) ||
    !(clearBtn instanceof HTMLButtonElement) ||
    !(status instanceof HTMLSpanElement)
  ) {
    return;
  }

  toggle.addEventListener('click', () => {
    bar.classList.toggle('is-hidden');
  });

  seedBtn.addEventListener('click', async () => {
    await seedDummyData();
    await renderApp();
    const nextStatus = document.getElementById('dev-status');
    if (nextStatus instanceof HTMLSpanElement) {
      nextStatus.textContent = 'Seeded.';
    }
  });

  clearBtn.addEventListener('click', async () => {
    await clearAllData();
    await renderApp();
    const nextStatus = document.getElementById('dev-status');
    if (nextStatus instanceof HTMLSpanElement) {
      nextStatus.textContent = 'Cleared.';
    }
  });
}

async function wireNotifToggle(): Promise<void> {
  const btn = document.getElementById('notif-toggle');
  if (!(btn instanceof HTMLButtonElement)) return;
  const enabled = await getNotificationsEnabled();
  btn.classList.toggle('is-off', !enabled);
  btn.addEventListener('click', async () => {
    const next = btn.classList.contains('is-off');
    await setNotificationsEnabled(next);
    btn.classList.toggle('is-off', !next);
  });
}

async function renderApp(): Promise<void> {
  const app = document.getElementById('app');
  if (app === null) return;

  const sessions = await getAllSessions();
  const todaySessions = sessions.filter((s) => s.dateKey === todayDateKey());
  const groups = groupSessionsByCode(todaySessions);

  app.replaceChildren();
  app.append(renderHeader());
  app.append(renderDevBar());
  for (const group of groups) {
    app.append(renderGroup(group));
    const separator = document.createElement('hr');
    separator.className = 'separator';
    app.append(separator);
  }
  app.append(renderFooter(groups));
  wireDevBar();
  await wireNotifToggle();
}

export function init(): void {
  document.addEventListener('DOMContentLoaded', () => void renderApp());
}

init();
