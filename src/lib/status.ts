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
