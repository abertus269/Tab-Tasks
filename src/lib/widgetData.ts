import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { eq } from 'drizzle-orm';

import { db, dbReady } from '@/db/client';
import { categories, settings, tasks } from '@/db/schema';
import migrations from '@/drizzle/migrations';
import { TAP_CYCLES_STATUS_DEFAULT, TAP_CYCLES_STATUS_KEY } from '@/hooks/useSettings';

import { todayString } from './dates';
import { compareTasks } from './ordering';
import { isDone } from './status';
import type { TaskWithCategory } from './types';

// The app always reaches this after `_layout.tsx` has already run
// `useMigrations`, so the migrate() call below is a no-op there. The
// headless task handler (widget/widget-task-handler.tsx) has no such
// guarantee — it can run before the app has ever been opened (widget placed
// right after install) or after an update shipped a schema change the app
// hasn't launched to apply yet. `migrate()` is the same idempotent journal
// `useMigrations` drives, just without the hook/React dependency, so it's
// safe to call unconditionally here rather than duplicating this guard at
// every call site.
let migratedOnce: Promise<void> | null = null;
async function ensureDbReady(): Promise<void> {
  await dbReady;
  if (!migratedOnce) {
    migratedOnce = migrate(db, migrations);
  }
  await migratedOnce;
}

// Shared by the app (called after every mutation, via requestWidgetUpdate)
// and the widget's headless task handler (called on every widget event) —
// one query, so the two surfaces can never disagree on what "today's tasks"
// means.
//
// Done tasks stay in the result (sorted last) rather than being filtered
// out: the widget has no undo toast like the Tasks tab does, so a mis-tap
// needs to stay reachable for a second tap back — see CLAUDE.md Widget.
export async function getTodayTasksForWidget(): Promise<TaskWithCategory[]> {
  await ensureDbReady();

  const today = todayString();
  const rows = db
    .select()
    .from(tasks)
    .leftJoin(categories, eq(tasks.categoryId, categories.id))
    .where(eq(tasks.dueDate, today))
    .all();

  return rows
    .map((row) => ({ ...row.tasks, category: row.categories }))
    .sort((a, b) => {
      const aDone = isDone(a.status);
      const bDone = isDone(b.status);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return compareTasks(a, b);
    });
}

// The widget's status-tap follows the same in-app setting (src/hooks/useSettings.ts)
// rather than hardcoding one behavior, so it never disagrees with how tapping a
// row in the app itself behaves.
export async function getTapCyclesStatusSetting(): Promise<boolean> {
  await ensureDbReady();

  const row = db.select().from(settings).where(eq(settings.key, TAP_CYCLES_STATUS_KEY)).get();
  return row ? row.value === 'true' : TAP_CYCLES_STATUS_DEFAULT;
}
