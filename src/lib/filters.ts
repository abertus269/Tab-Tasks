import { isDone, type TaskStatus } from '@/lib/status';

// The Tasks tab's filter row is one flat set of mutually exclusive chips —
// category chips, 'all', 'uncategorized', and the trailing 'completed' chip
// all narrow the same single `activeFilter` state (src/app/(tabs)/index.tsx).
// There is no separate "show completed" toggle layered on top of category
// filtering; Completed is just another value this type can take.
export const COMPLETED_FILTER = 'completed';

// `string & {}` keeps literal-type autocomplete for 'all'/'uncategorized'/
// 'completed' while still accepting any category id string.
export type FilterValue = 'all' | 'uncategorized' | typeof COMPLETED_FILTER | (string & {});

export interface FilterableTask {
  categoryId: string | null;
  status: TaskStatus;
}

// Category scope only, ignoring status — used to tell "no tasks in this
// category" apart from "every task in this category is done" (§ emptyMessageFor).
export function inCategoryScope(task: { categoryId: string | null }, filter: FilterValue): boolean {
  if (filter === 'all' || filter === COMPLETED_FILTER) return true;
  if (filter === 'uncategorized') return task.categoryId === null;
  return task.categoryId === filter;
}

// The Completed chip shows only done tasks; every other filter (all,
// uncategorized, or a category) shows only not-done tasks — done tasks live
// nowhere but the Completed view (SPEC.md §4).
export function matchesFilter(task: FilterableTask, filter: FilterValue): boolean {
  if (!inCategoryScope(task, filter)) return false;
  return filter === COMPLETED_FILTER ? isDone(task.status) : !isDone(task.status);
}

export function filterTasks<T extends FilterableTask>(tasks: T[], filter: FilterValue): T[] {
  return tasks.filter((task) => matchesFilter(task, filter));
}

// hasAnyInScope: whether any task exists in this filter's category scope,
// regardless of status — distinguishes "nothing here at all" from "everything
// here is done" so the empty state can say which one is true.
export function emptyMessageFor(filter: FilterValue, hasAnyInScope: boolean): string {
  if (filter === COMPLETED_FILTER) return 'No completed tasks yet.';
  if (hasAnyInScope) return 'All done.';
  if (filter === 'all') return 'No tasks yet.';
  return 'No tasks in this category.';
}
