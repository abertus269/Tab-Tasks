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

export type RenderRow<T> = { type: 'divider' } | { type: 'task'; task: T };

// Inserts the today-divider into an already-sorted (by compareTasks) task list.
// The divider is a derived render position, never a stored row: it sits before
// the first task whose dueDate >= today. If nothing is overdue that's index 0
// (top); if everything is overdue it lands after the last row (bottom); an
// empty list places it at the top.
export function withTodayDivider<T extends { dueDate: string }>(
  tasks: T[],
  todayStr: string,
): RenderRow<T>[] {
  const firstNotOverdue = tasks.findIndex((t) => t.dueDate >= todayStr);
  const insertAt = firstNotOverdue === -1 ? tasks.length : firstNotOverdue;

  const rows: RenderRow<T>[] = tasks.map((task) => ({ type: 'task', task }));
  rows.splice(insertAt, 0, { type: 'divider' });
  return rows;
}
