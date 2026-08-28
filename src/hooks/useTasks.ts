import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { and, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { categories, tasks } from '@/db/schema';
import { currentYearString } from '@/lib/dates';
import { compareTasks } from '@/lib/ordering';
import type { TaskWithCategory } from '@/lib/types';

type JoinedRow = {
  tasks: typeof tasks.$inferSelect;
  categories: typeof categories.$inferSelect | null;
};

function toTaskWithCategory(row: JoinedRow): TaskWithCategory {
  return { ...row.tasks, category: row.categories };
}

function useJoinedTasks(where?: SQL | undefined) {
  const query = useMemo(() => {
    const base = db.select().from(tasks).leftJoin(categories, eq(tasks.categoryId, categories.id));
    return where ? base.where(where) : base;
  }, [where]);

  // drizzle's useLiveQuery defaults its internal effect's deps to `[]` — pass
  // `[query]` explicitly or it subscribes once with whatever `query` was on
  // first mount and never re-subscribes when `where` (and so `query`)
  // changes. Without this, e.g. Calendar's Day view keeps showing the first
  // day's tasks forever as you navigate to other days.
  const { data } = useLiveQuery(query, [query]);

  return useMemo(() => (data ?? []).map(toTaskWithCategory).sort(compareTasks), [data]);
}

// Every task, merged and sorted — the Tasks tab's single unified list.
// Never split or grouped by category; filtering that list is a view-only
// concern handled by the caller, not by this hook.
export function useAllTasks(): TaskWithCategory[] {
  return useJoinedTasks();
}

// Every task with dueDate in [start, end], inclusive — drives Day/Week/Month.
export function useTasksInRange(start: string, end: string): TaskWithCategory[] {
  const where = useMemo(() => and(gte(tasks.dueDate, start), lte(tasks.dueDate, end)), [start, end]);
  return useJoinedTasks(where);
}

// A single task by id, or null while it's loading / after it's deleted —
// callers (the edit form) should treat null as "not available yet".
export function useTask(id: string | undefined): TaskWithCategory | null {
  const where = useMemo(() => (id ? eq(tasks.id, id) : undefined), [id]);
  const rows = useJoinedTasks(where);
  return id ? (rows[0] ?? null) : null;
}

// Per-date task counts within [start, end] — Month view's dot indicators.
export function useTaskCountsInRange(start: string, end: string): Record<string, number> {
  const query = useMemo(
    () =>
      db
        .select({ dueDate: tasks.dueDate, count: sql<number>`count(*)` })
        .from(tasks)
        .where(and(gte(tasks.dueDate, start), lte(tasks.dueDate, end)))
        .groupBy(tasks.dueDate),
    [start, end],
  );
  const { data } = useLiveQuery(query, [query]);

  return useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      map[row.dueDate] = row.count;
    }
    return map;
  }, [data]);
}

export interface YearCount {
  year: string;
  count: number;
}

// SPEC.md §5.4 — years that have tasks, plus the current year even at zero.
export function useYearCounts(): YearCount[] {
  const query = useMemo(
    () =>
      db
        .select({ year: sql<string>`substr(${tasks.dueDate}, 1, 4)`, count: sql<number>`count(*)` })
        .from(tasks)
        .groupBy(sql`substr(${tasks.dueDate}, 1, 4)`),
    [],
  );
  const { data } = useLiveQuery(query, [query]);

  return useMemo(() => {
    const rows = data ?? [];
    const currentYear = currentYearString();
    const withCurrent = rows.some((r) => r.year === currentYear)
      ? rows
      : [...rows, { year: currentYear, count: 0 }];
    return [...withCurrent].sort((a, b) => (a.year < b.year ? 1 : -1));
  }, [data]);
}
