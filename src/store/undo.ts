import { useSyncExternalStore } from 'react';

import { restoreTask, setTaskStatus } from '@/db/mutations';
import type { PendingUndo } from '@/lib/undo';

const UNDO_WINDOW_MS = 5000;

// One app-wide pending-undo slot (5s window), not one per screen. A delete
// from the task form has to surface its Undo on whichever list the form
// returns to — the form unmounts the moment it closes, so a toast owned by
// the form (or by one screen's useTaskRowActions) would vanish with it.
// Every screen that renders an UndoToast reads this same slot; only the
// focused one is on screen, so at most one toast is ever visible.
let pending: PendingUndo | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function startUndoWindow(next: PendingUndo) {
  if (timer) clearTimeout(timer);
  pending = next;
  timer = setTimeout(dismissUndo, UNDO_WINDOW_MS);
  emit();
}

export function dismissUndo() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (pending === null) return;
  pending = null;
  emit();
}

export async function performUndo() {
  const target = pending;
  if (!target) return;
  dismissUndo();
  if (target.kind === 'delete') {
    const { category: _category, ...row } = target.task;
    await restoreTask(row);
  } else {
    await setTaskStatus(target.task.id, target.previousStatus);
  }
}

export function usePendingUndo(): PendingUndo | null {
  return useSyncExternalStore(subscribe, () => pending);
}
