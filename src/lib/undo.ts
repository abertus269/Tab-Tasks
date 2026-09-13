import type { TaskStatus } from '@/lib/status';
import type { TaskWithCategory } from '@/lib/types';

// useTaskRowActions holds a single pending-undo slot (5s window) shared by
// the delete path and the swipe/tap-to-complete path, so the toast can say
// what it's actually undoing and Undo can branch on how to reverse it.
export type PendingUndo =
  | { kind: 'delete'; task: TaskWithCategory }
  | { kind: 'status'; task: TaskWithCategory; previousStatus: TaskStatus };

export function undoToastMessage(pending: PendingUndo | null): string {
  if (!pending) return '';
  if (pending.kind === 'delete') return 'Task deleted';
  return pending.previousStatus === 'done' ? 'Task reopened' : 'Task completed';
}
