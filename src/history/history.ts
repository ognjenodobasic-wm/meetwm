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
let openEditSessionId: string | null = null;
let refreshHistory: (() => Promise<void>) | null = null;

function renderTabs(
  root: HTMLElement,
  current: RangePreset,
  referenceDate: Date,
  onChange: (p: RangePreset) => void,
  onPrev: () => void,
  onNext: () => void,
): void {
  root.innerHTML = '';

  const segGroup = document.createElement('div');
  segGroup.className = 'seg-group';
  const presets: RangePreset[] = ['day', 'week', 'month'];
  const labels: Record<RangePreset, string> = { day: 'Day', week: 'Week', month: 'Month' };
  for (const p of presets) {
    const btn = document.createElement('button');
    btn.className = p === current ? 'seg active' : 'seg';
    btn.textContent = labels[p];
    btn.addEventListener('click', () => onChange(p));
    segGroup.appendChild(btn);
  }

  const periodNav = document.createElement('div');
  periodNav.className = 'period-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'nav-btn';
  prevBtn.textContent = '←';
  prevBtn.addEventListener('click', () => onPrev());

  const label = document.createElement('span');
  label.className = 'period-label';
  label.textContent = formatPeriodLabel(current, referenceDate);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'nav-btn';
  nextBtn.textContent = '→';
  nextBtn.addEventListener('click', () => onNext());

  periodNav.append(prevBtn, label, nextBtn);

  root.append(segGroup, periodNav);
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

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.setAttribute('aria-label', 'Edit session');
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', () => {
        openEditSessionId = openEditSessionId === s.id ? null : s.id;
        renderGroups(root, groups);
      });

      sRow.append(timeEl, durEl, editBtn);
      sessionsEl.appendChild(sRow);

      if (openEditSessionId === s.id) {
        const editPanel = document.createElement('div');
        editPanel.className = 'edit-panel';

        const titleIn = document.createElement('input');
        titleIn.value = s.title ?? '';
        titleIn.placeholder = 'Title';

        const tagIn = document.createElement('input');
        tagIn.value = s.projectTag ?? '';
        tagIn.placeholder = 'Tag';

        editPanel.append(titleIn, tagIn);

        let endIn: HTMLInputElement | null = null;
        if (s.endTime === null) {
          endIn = document.createElement('input');
          endIn.type = 'datetime-local';
          editPanel.appendChild(endIn);
        }

        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', async () => {
          const updates: Partial<MeetingSession> = {
            title: titleIn.value || null,
            projectTag: tagIn.value || null,
          };
          if (endIn !== null) {
            const v = endIn.valueAsNumber;
            if (!isNaN(v)) updates.endTime = v;
          }
          await updateSession(s.id, updates);
          openEditSessionId = null;
          await refreshHistory?.();
        });
        editPanel.appendChild(saveBtn);

        sessionsEl.appendChild(editPanel);
      }
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

  const page = document.createElement('div');
  page.className = 'page';
  rangeNav.replaceWith(page);

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

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.append(rangeNav, exportBtn);

  page.append(toolbar, app);

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

  refreshHistory = doRender;
  await doRender();
}

init();
