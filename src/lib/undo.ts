import type { TaskStatus } from '@/lib/status';
import type { TaskWithCategory } from '@/lib/types';

// src/store/undo.ts holds a single app-wide pending-undo slot (5s window)
// shared by the delete path and the swipe/tap-to-complete path, so the toast can say
// what it's actually undoing and Undo can branch on how to reverse it.
export type PendingUndo =
  | { kind: 'delete'; task: TaskWithCategory }
  | { kind: 'status'; task: TaskWithCategory; previousStatus: TaskStatus };

const TITLE_LIMIT = 26;

// The toast names the task it's about — "Task deleted" alone doesn't say
// which one, and the 5s window is short for someone who looked away. Long
// titles are cut so the Undo button always keeps its room on the pill.
function quotedTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length <= TITLE_LIMIT) return `“${trimmed}”`;

  // Cut back to the last whole word when that doesn't throw away most of the
  // title, so the toast reads "Call the landlord about…" not "…about t…".
  const cut = trimmed.slice(0, TITLE_LIMIT - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = trimmed[TITLE_LIMIT - 1] !== ' ' && lastSpace > TITLE_LIMIT / 2 ? cut.slice(0, lastSpace) : cut;
  return `“${base.trimEnd()}…”`;
}

export function undoToastMessage(pending: PendingUndo | null): string {
  if (!pending) return '';
  const name = quotedTitle(pending.task.title);
  if (pending.kind === 'delete') return `Deleted ${name}`;
  return pending.previousStatus === 'done' ? `Reopened ${name}` : `Finished ${name}`;
}
