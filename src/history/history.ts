import type { SessionGroup } from '../shared/grouping.js';

/**
 * History page — spec §5. Day / week / month, per-session manual edits, export.
 *
 * Grouping and duration formatting come from `../shared/grouping.js`. Do not
 * reimplement them here — popup and history must stay on one implementation.
 */

export type RangePreset = 'day' | 'week' | 'month';

/** TODO(phase 1): render the accordion for the selected range. */
export function render(_root: HTMLElement, _groups: SessionGroup[]): void {
  // TODO
}

/** TODO(phase 1): CSV / clipboard export in decimal hours. */
export function exportSessions(_groups: SessionGroup[]): string {
  throw new Error('exportSessions: not implemented');
}

/** TODO(phase 1): wire range filters and edit handlers, then render. */
export function init(): void {
  // TODO
}

init();
