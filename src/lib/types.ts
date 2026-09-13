import type { TaskStatus } from '@/lib/status';

export interface CategoryRecord {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
  dueTime: string | null; // 'HH:mm'
  description: string | null;
  categoryId: string | null;
  icon: string | null;
  status: TaskStatus;
  reminderMinutesBefore: number | null;
  createdAt: string;
}

export interface TaskWithCategory extends TaskRecord {
  category: CategoryRecord | null;
}

// Screen-space rect of a rendered TaskRow, captured via measureInWindow at
// long-press time so TaskContextMenu can float its Edit/Delete card directly
// against that row instead of a bottom sheet.
export interface RowAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

// SwipeableTaskRow's two swipe-to-complete personalities (src/hooks/useTaskRowActions.ts):
// - 'exit'   (Tasks tab): a completed swipe/tap slides the row out and collapses it before
//   the status write lands, since done tasks don't stay in that list.
// - 'toggle' (Calendar Day/Week): a completed swipe flips the status in place and springs
//   back, since done tasks stay visible (struck through) in the agenda views.
export type CompleteBehavior = 'exit' | 'toggle';

// Why a row's exit animation is ending — decides which callback fires when the
// slide-out + collapse finishes (SwipeableTaskRow's runExit/registerExit).
export type ExitReason = 'delete' | 'complete';

export type RowExitTrigger = (direction: 1 | -1, reason: ExitReason) => void;

export type RegisterRowExit = (taskId: string, trigger: RowExitTrigger) => () => void;
