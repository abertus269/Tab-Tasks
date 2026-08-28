export interface OrderableTask {
  dueDate: string; // 'YYYY-MM-DD'
  dueTime: string | null; // 'HH:mm'
  createdAt: string;
}

// SPEC.md §4 ordering: ascending by dueDate then dueTime. Within the same date,
// an untimed task sits before a timed one — an unscheduled "sometime today"
// task reads more urgently than one pinned to a later hour. createdAt is the
// final tie-break for otherwise-identical rows.
export function compareTasks(a: OrderableTask, b: OrderableTask): number {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;

  const aTimed = a.dueTime !== null;
  const bTimed = b.dueTime !== null;
  if (aTimed !== bTimed) return aTimed ? 1 : -1;
  if (aTimed && bTimed && a.dueTime !== b.dueTime) {
    return a.dueTime! < b.dueTime! ? -1 : 1;
  }

  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return 0;
}

export type RenderRow<T> =
  | { type: 'divider'; kind: 'today' | 'upcoming' }
  | { type: 'emptyToday' }
  | { type: 'task'; task: T };

// Inserts the Today/Upcoming dividers into an already-sorted (by
// compareTasks) task list. Both are derived render positions, never stored
// rows.
//
// The Today divider sits before the first task whose dueDate >= today —
// unchanged from the original single-divider behavior: nothing overdue puts
// it at index 0, everything overdue puts it after the last row, an empty
// list puts it at the top.
//
// The Upcoming divider sits before the first task whose dueDate > today, and
// only appears when a future task actually exists — a list with nothing
// after today just keeps the lone Today divider, exactly as before.
//
// When there's a future task but nothing due exactly today, the two
// dividers would land back-to-back; a muted "Nothing due today" row goes
// between them instead of letting a future task sit directly under "Today"
// (the bug this fixes — see SPEC.md's "Add tasks Not for Today").
export function withListDividers<T extends { dueDate: string }>(
  tasks: T[],
  todayStr: string,
): RenderRow<T>[] {
  const firstNotOverdue = tasks.findIndex((t) => t.dueDate >= todayStr);
  const todayIndex = firstNotOverdue === -1 ? tasks.length : firstNotOverdue;

  const firstFuture = tasks.findIndex((t) => t.dueDate > todayStr);
  const upcomingIndex = firstFuture === -1 ? tasks.length : firstFuture;

  const hasFuture = upcomingIndex < tasks.length;
  const hasToday = todayIndex < upcomingIndex;

  const rows: RenderRow<T>[] = [];
  for (let i = 0; i <= tasks.length; i++) {
    if (i === todayIndex) {
      rows.push({ type: 'divider', kind: 'today' });
      if (hasFuture && !hasToday) {
        rows.push({ type: 'emptyToday' });
        rows.push({ type: 'divider', kind: 'upcoming' });
      }
    } else if (i === upcomingIndex && hasFuture && hasToday) {
      rows.push({ type: 'divider', kind: 'upcoming' });
    }
    if (i < tasks.length) rows.push({ type: 'task', task: tasks[i] });
  }
  return rows;
}
