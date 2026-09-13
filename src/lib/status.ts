export type TaskStatus = 'todo' | 'active' | 'done';

// Tapping a row advances its status. With the cycle setting on, a task walks
// through all three states; off, a tap is a plain done/not-done toggle —
// matching the two-state behavior the app shipped with before this existed.
export function nextStatus(current: TaskStatus, cycleEnabled: boolean): TaskStatus {
  if (!cycleEnabled) {
    return current === 'done' ? 'todo' : 'done';
  }
  if (current === 'todo') return 'active';
  if (current === 'active') return 'done';
  return 'todo';
}

export function isDone(status: TaskStatus): boolean {
  return status === 'done';
}

// True when a change crosses the done boundary either way — i.e. the row
// would leave a view that shows only done tasks or only not-done tasks
// (the Tasks tab's main list vs. its Completed filter). Swipe-to-complete and
// tap-to-cycle both use this to decide whether a status change should
// animate the row out of the current view (src/hooks/useTaskRowActions.ts).
export function crossesDone(from: TaskStatus, to: TaskStatus): boolean {
  return isDone(from) !== isDone(to);
}
