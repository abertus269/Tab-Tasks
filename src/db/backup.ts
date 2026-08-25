import Constants from 'expo-constants';

import migrations from '@/drizzle/migrations';
import { buildBackup, type BackupFile } from '@/lib/backup';
import { cancelAllReminders, syncTaskReminder } from '@/lib/notifications';

import { db } from './client';
import { categories, tasks } from './schema';

function currentSchemaVersion(): number {
  return migrations.journal.entries.length;
}

function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? 'unknown';
}

// One-shot reads for a backup — not the useLiveQuery hooks in hooks/useTasks.ts,
// which are for rendering. Categories are selected explicitly (rather than
// db.select().from(categories)) so the file matches CategoryRecord exactly
// and doesn't leak the DB-internal createdAt column.
export function readAllForBackup(): BackupFile {
  const categoryRows = db
    .select({ id: categories.id, name: categories.name, color: categories.color, icon: categories.icon })
    .from(categories)
    .all();
  const taskRows = db.select().from(tasks).all();

  return buildBackup(categoryRows, taskRows, {
    schemaVersion: currentSchemaVersion(),
    appVersion: currentAppVersion(),
  });
}

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  categoriesImported: number;
  tasksImported: number;
}

// All row-level work runs inside one synchronous transaction (expo-sqlite's
// driver is sync — db.transaction here matches the pattern already used for
// deleteCategory's delete-with-tasks path in mutations.ts) so a failure
// partway through can't leave the database half-restored. Reminder syncing
// happens after the transaction commits, since Notifications.* calls are
// async.
export async function importBackup(data: BackupFile, mode: ImportMode): Promise<ImportResult> {
  if (mode === 'replace') {
    await cancelAllReminders();
  }

  db.transaction((tx) => {
    if (mode === 'replace') {
      tx.delete(tasks).run();
      tx.delete(categories).run();
    }

    // Categories first. categories.name is UNIQUE (schema.ts), so a backup
    // category whose name already exists under a *different* id would throw
    // mid-import — instead, reuse the existing category's id and remap every
    // task that pointed at the incoming one.
    const idRemap = new Map<string, string>();
    const existingByName = new Map(
      tx
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .all()
        .map((c) => [c.name, c.id] as const),
    );

    for (const category of data.categories) {
      const collisionId = existingByName.get(category.name);
      if (collisionId && collisionId !== category.id) {
        idRemap.set(category.id, collisionId);
        continue;
      }
      tx.insert(categories)
        .values(category)
        .onConflictDoUpdate({
          target: categories.id,
          set: { name: category.name, color: category.color, icon: category.icon },
        })
        .run();
      existingByName.set(category.name, category.id);
    }

    for (const task of data.tasks) {
      const categoryId = task.categoryId ? (idRemap.get(task.categoryId) ?? task.categoryId) : null;
      const row = { ...task, categoryId };
      tx.insert(tasks)
        .values(row)
        .onConflictDoUpdate({ target: tasks.id, set: row })
        .run();
    }
  });

  await Promise.all(data.tasks.map((task) => syncTaskReminder(task)));

  return { categoriesImported: data.categories.length, tasksImported: data.tasks.length };
}
