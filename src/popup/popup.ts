import type { SessionGroup } from '../shared/grouping.js';

/**
 * Toolbar popup — spec §5. Today only, accordion grouped by `meetingCode`.
 *
 * Grouping and duration formatting come from `../shared/grouping.js`. The popup
 * holds rendering only — no second copy of that logic.
 */

/** TODO(phase 1): read today's sessions, group them, render the accordion. */
export function render(_root: HTMLElement, _groups: SessionGroup[]): void {
  // TODO
}

/** TODO(phase 1): load today's sessions, group them via shared/grouping, render. */
export function init(): void {
  // TODO
}

init();
