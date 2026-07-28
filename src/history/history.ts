import type { MeetingSession } from '../shared/types.js';
import {
  groupSessionsByCode,
  formatDuration,
  type GroupedMeeting,
} from '../shared/grouping.js';
import { getAllSessions, updateSession } from '../shared/storage.js';

/**
 * History page — spec §5. Day / week / month, per-session manual edits, export.
 *
 * Grouping and duration formatting come from `../shared/grouping.js`. Do not
 * reimplement them here — popup and history must stay on one implementation.
 */

export type RangePreset = 'day' | 'week' | 'month';

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'avg', 'sep', 'okt', 'nov', 'dec',
];

function dateKeyFor(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The date `offset` units (of `preset`'s kind) back from today. */
function referenceDateFor(preset: RangePreset, offset: number): Date {
  const ref = new Date();
  if (preset === 'day') ref.setDate(ref.getDate() - offset);
  else if (preset === 'week') ref.setDate(ref.getDate() - offset * 7);
  else ref.setMonth(ref.getMonth() - offset);
  return ref;
}

function periodBounds(preset: RangePreset, referenceDate: Date): { from: Date; to: Date } {
  if (preset === 'day') {
    return { from: referenceDate, to: referenceDate };
  }
  if (preset === 'week') {
    const day = referenceDate.getDay();
    const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), diff);
    const sun = new Date(mon.getTime() + 6 * 24 * 60 * 60 * 1000);
    return { from: mon, to: sun };
  }
  const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const last = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  return { from: first, to: last };
}

function getRange(preset: RangePreset, referenceDate: Date): { from: string; to: string } {
  const { from, to } = periodBounds(preset, referenceDate);
  return { from: dateKeyFor(from.getTime()), to: dateKeyFor(to.getTime()) };
}

function formatPeriodLabel(preset: RangePreset, referenceDate: Date): string {
  const { from, to } = periodBounds(preset, referenceDate);
  if (preset === 'day') {
    return `${from.getDate()}. ${MONTHS[from.getMonth()]} ${from.getFullYear()}.`;
  }
  if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
    return `${from.getDate()}–${to.getDate()}. ${MONTHS[from.getMonth()]} ${from.getFullYear()}.`;
  }
  if (from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()}. ${MONTHS[from.getMonth()]} – ${to.getDate()}. ${MONTHS[to.getMonth()]} ${to.getFullYear()}.`;
  }
  return `${from.getDate()}. ${MONTHS[from.getMonth()]} ${from.getFullYear()}. – ${to.getDate()}. ${MONTHS[to.getMonth()]} ${to.getFullYear()}.`;
}

function sessionDurationMs(session: MeetingSession): number | null {
  if (session.endTime === null) return null;
  return session.endTime - session.startTime;
}

let openGroupIndex = -1;
let periodOffset = 0;

function renderTabs(
  root: HTMLElement,
  current: RangePreset,
  referenceDate: Date,
  onChange: (p: RangePreset) => void,
  onPrev: () => void,
  onNext: () => void,
): void {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'period-tabs';
  const presets: RangePreset[] = ['day', 'week', 'month'];
  const labels: Record<RangePreset, string> = { day: 'Day', week: 'Week', month: 'Month' };
  for (const p of presets) {
    const btn = document.createElement('button');
    btn.className = p === current ? 'period-tab is-active' : 'period-tab';
    btn.textContent = labels[p];
    btn.addEventListener('click', () => onChange(p));
    wrap.appendChild(btn);
  }

  const prevBtn = document.createElement('button');
  prevBtn.className = 'period-nav';
  prevBtn.textContent = '←';
  prevBtn.addEventListener('click', () => onPrev());

  const label = document.createElement('span');
  label.className = 'period-label';
  label.textContent = formatPeriodLabel(current, referenceDate);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'period-nav';
  nextBtn.textContent = '→';
  nextBtn.addEventListener('click', () => onNext());

  wrap.append(prevBtn, label, nextBtn);
  root.appendChild(wrap);
}

function renderGroups(root: HTMLElement, groups: GroupedMeeting[]): void {
  root.innerHTML = '';
  groups.forEach((group, gi) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'group';
    if (gi === openGroupIndex) groupEl.classList.add('is-open');

    const row = document.createElement('div');
    row.className = 'group-row';
    const title = document.createElement('span');
    title.className = 'group-title';
    title.textContent = group.title;
    const meta = document.createElement('span');
    meta.className = 'group-meta';
    const hasInProgress = group.sessions.some((s) => s.status === 'in-progress');
    const hasIncomplete = group.sessions.some((s) => s.status === 'incomplete');
    if (hasInProgress) {
      meta.classList.add('is-warning');
      meta.textContent = 'u toku';
    } else if (hasIncomplete) {
      meta.classList.add('is-warning');
      meta.textContent = `nezavršeno (${group.sessionCount})`;
    } else {
      meta.textContent = `${group.uiLabel} (${group.sessionCount})`;
    }
    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '▾';
    row.append(title, meta, chevron);
    row.addEventListener('click', () => {
      openGroupIndex = openGroupIndex === gi ? -1 : gi;
      renderGroups(root, groups);
    });

    const sessionsEl = document.createElement('div');
    sessionsEl.className = 'sessions';
    for (const { session: s } of group.sessions) {
      const sRow = document.createElement('div');
      sRow.className = 'session-row';
      const durMs = sessionDurationMs(s);
      const durEl = document.createElement('span');
      durEl.className = 'session-duration';
      if (durMs === null) {
        durEl.classList.add('is-warning');
        durEl.textContent = s.dateKey === dateKeyFor(Date.now()) ? 'u toku' : 'nezavršeno';
      } else {
        durEl.textContent = formatDuration(durMs);
      }
      const timeEl = document.createElement('span');
      const start = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '…';
      timeEl.textContent = `${start} – ${end}`;

      const editEl = document.createElement('div');
      editEl.className = 'session-edit';
      const titleIn = document.createElement('input');
      titleIn.value = s.title ?? '';
      titleIn.placeholder = 'Title';
      titleIn.addEventListener('change', async () => {
        await updateSession(s.id, { title: titleIn.value || null });
      });
      const tagIn = document.createElement('input');
      tagIn.value = s.projectTag ?? '';
      tagIn.placeholder = 'Tag';
      tagIn.addEventListener('change', async () => {
        await updateSession(s.id, { projectTag: tagIn.value || null });
      });
      editEl.append(titleIn, tagIn);

      if (s.endTime === null) {
        const endIn = document.createElement('input');
        endIn.type = 'datetime-local';
        endIn.addEventListener('change', async () => {
          const v = endIn.valueAsNumber;
          if (!isNaN(v)) {
            await updateSession(s.id, { endTime: v });
          }
        });
        editEl.appendChild(endIn);
      }

      sRow.append(timeEl, durEl, editEl);
      sessionsEl.appendChild(sRow);
    }

    groupEl.append(row, sessionsEl);
    root.appendChild(groupEl);
  });
}

export function render(root: HTMLElement, groups: GroupedMeeting[]): void {
  renderGroups(root, groups);
}

function filterSessions(
  sessions: MeetingSession[],
  preset: RangePreset,
  offset: number,
): MeetingSession[] {
  const { from, to } = getRange(preset, referenceDateFor(preset, offset));
  return sessions.filter((s) => s.dateKey >= from && s.dateKey <= to);
}

/**
 * Per-session decimal hours, computed directly from that session's own
 * timestamps — not pulled from `GroupedMeeting.decimalHours`, which is a
 * per-group aggregate. Sessions with `endTime: null` are skipped.
 */
export function exportSessions(sessions: MeetingSession[]): string {
  return sessions
    .filter((s) => s.endTime !== null)
    .map((s) => {
      const hours = Math.round(((s.endTime! - s.startTime) / 3_600_000) * 100) / 100;
      return `${s.dateKey},${s.meetingCode},${s.title ?? ''},${hours}`;
    })
    .join('\n');
}

export async function init(): Promise<void> {
  const app = document.getElementById('app');
  const rangeNav = document.getElementById('range');
  if (!app || !rangeNav) return;

  let preset: RangePreset = 'day';

  const exportBtn = document.createElement('button');
  exportBtn.className = 'export-button';
  exportBtn.textContent = 'Export';
  exportBtn.addEventListener('click', async () => {
    const sessions = await getAllSessions();
    const filtered = filterSessions(sessions, preset, periodOffset);
    const text = exportSessions(filtered);
    try {
      await navigator.clipboard.writeText(text);
      exportBtn.textContent = 'Copied!';
    } catch {
      exportBtn.textContent = 'Copy failed';
    }
    setTimeout(() => { exportBtn.textContent = 'Export'; }, 1500);
  });

  if (app.parentElement) {
    app.parentElement.insertBefore(exportBtn, app);
  }

  const doRender = async () => {
    const sessions = await getAllSessions();
    const filtered = filterSessions(sessions, preset, periodOffset);
    const groups = groupSessionsByCode(filtered);
    renderTabs(
      rangeNav,
      preset,
      referenceDateFor(preset, periodOffset),
      async (p) => {
        preset = p;
        periodOffset = 0;
        openGroupIndex = -1;
        await doRender();
      },
      async () => {
        periodOffset += 1;
        openGroupIndex = -1;
        await doRender();
      },
      async () => {
        periodOffset = Math.max(0, periodOffset - 1);
        openGroupIndex = -1;
        await doRender();
      },
    );
    renderGroups(app, groups);
  };

  await doRender();
}

init();
