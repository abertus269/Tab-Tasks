import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { cancelTaskReminder, syncTaskReminder } from '@/lib/notifications';
import type { TaskStatus } from '@/lib/status';
import type { TaskRecord } from '@/lib/types';

import { db } from './client';
import { categories, settings, tasks } from './schema';

export interface TaskInput {
  title: string;
  dueDate: string;
  dueTime: string | null;
  description: string | null;
  categoryId: string | null;
  icon: string | null;
  reminderMinutesBefore: number | null;
}

// Every mutation below awaits its reminder sync rather than firing it as an
// untracked side effect — the failure mode being designed against is a
// mutation that touches the DB and forgets the notification, leaving a
// reminder orphaned for a task that was just edited, completed, or deleted.
export async function createTask(input: TaskInput): Promise<string> {
  const id = randomUUID();
  const row = db.insert(tasks).values({ id, status: 'todo', ...input }).returning().get();
  await syncTaskReminder(row);
  return id;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  const row = db.update(tasks).set(input).where(eq(tasks.id, id)).returning().get();
  await syncTaskReminder(row);
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const row = db.update(tasks).set({ status }).where(eq(tasks.id, id)).returning().get();
  // A reminder for a task already marked done is pure noise — syncTaskReminder
  // cancels it; cycling off done restores it if its fire time is still ahead.
  await syncTaskReminder(row);
}

export async function deleteTask(id: string): Promise<void> {
  db.delete(tasks).where(eq(tasks.id, id)).run();
  await cancelTaskReminder(id);
}

// Reinstates a task removed via the swipe/menu delete's undo toast, keyed on
// its own snapshot rather than createTask's fresh-uuid path — preserving id
// and createdAt is what makes it re-sort back into the same list position
// (src/lib/ordering.ts) instead of reappearing as a brand-new task.
export async function restoreTask(task: TaskRecord): Promise<void> {
  const row = db.insert(tasks).values(task).returning().get();
  await syncTaskReminder(row);
}

export interface CategoryInput {
  name: string;
  color: string;
  icon: string | null;
}

export function createCategory(input: CategoryInput): string {
  const id = randomUUID();
  db.insert(categories)
    .values({ id, ...input })
    .run();
  return id;
}

export function updateCategory(id: string, input: CategoryInput): void {
  db.update(categories).set(input).where(eq(categories.id, id)).run();
}

export type CategoryDeleteMode = 'reassign' | 'deleteTasks';

// SPEC.md §2.2 — deleting a category always prompts: reassign its tasks to
// Uncategorized, or delete them too. Never a silent delete. Reassignment is
// free: PRAGMA foreign_keys=ON (see db/client.ts) makes the FK's
// ON DELETE SET NULL null out category_id on every referencing task the
// moment the category row is deleted.
export async function deleteCategory(id: string, mode: CategoryDeleteMode): Promise<void> {
  if (mode === 'deleteTasks') {
    // Read the affected ids before the transaction removes them — cancelling
    // a reminder after its task row is gone would have nothing to key off of.
    const affected = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.categoryId, id)).all();
    db.transaction((tx) => {
      tx.delete(tasks).where(eq(tasks.categoryId, id)).run();
      tx.delete(categories).where(eq(categories.id, id)).run();
    });
    await Promise.all(affected.map((task) => cancelTaskReminder(task.id)));
  } else {
    db.delete(categories).where(eq(categories.id, id)).run();
  }
}

export function setSetting(key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}
