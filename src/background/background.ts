import { formatDuration } from '../shared/grouping.js';
import { getNotificationsEnabled } from '../shared/storage.js';

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (
    typeof message !== 'object' ||
    message === null ||
    (message as { type?: unknown }).type !== 'MEETING_ENDED'
  ) return;
  const { durationMs } = message as { type: string; durationMs: number };
  void (async () => {
    if (!(await getNotificationsEnabled())) return;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/public/icon128.png',
      title: 'MeetWM',
      message: `Sastanak završen, ukupno trajanje ${formatDuration(durationMs)}, ubeležen u bazu.`,
    });
  })();
});
