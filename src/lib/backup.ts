import type { CategoryRecord, TaskRecord } from './types';

export const BACKUP_FORMAT = 'tab-tasks-backup';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string; // ISO
  categories: CategoryRecord[];
  tasks: TaskRecord[];
}

export function buildBackup(
  categories: CategoryRecord[],
  tasks: TaskRecord[],
  meta: { schemaVersion: number; appVersion: string },
): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: meta.schemaVersion,
    appVersion: meta.appVersion,
    exportedAt: new Date().toISOString(),
    categories,
    tasks,
  };
}

export type ParseBackupResult = { ok: true; data: BackupFile } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullOr<T>(value: unknown, check: (v: unknown) => v is T): value is T | null {
  return value === null || check(value);
}

function validateCategory(row: unknown, index: number): string | null {
  if (typeof row !== 'object' || row === null) return `categories[${index}] is not an object`;
  const c = row as Record<string, unknown>;
  if (!isString(c.id)) return `categories[${index}].id must be a string`;
  if (!isString(c.name) || c.name.length === 0) return `categories[${index}].name must be a non-empty string`;
  if (!isString(c.color) || !HEX_COLOR_RE.test(c.color)) return `categories[${index}].color must be a hex color`;
  if (!isNullOr(c.icon, isString)) return `categories[${index}].icon must be a string or null`;
  return null;
}

function validateTask(row: unknown, index: number): string | null {
  if (typeof row !== 'object' || row === null) return `tasks[${index}] is not an object`;
  const t = row as Record<string, unknown>;
  if (!isString(t.id)) return `tasks[${index}].id must be a string`;
  if (!isString(t.title) || t.title.length === 0) return `tasks[${index}].title must be a non-empty string`;
  if (!isString(t.dueDate) || !DATE_RE.test(t.dueDate)) return `tasks[${index}].dueDate must be YYYY-MM-DD`;
  if (!isNullOr(t.dueTime, (v): v is string => isString(v) && TIME_RE.test(v))) {
    return `tasks[${index}].dueTime must be HH:mm or null`;
  }
  if (!isNullOr(t.description, isString)) return `tasks[${index}].description must be a string or null`;
  if (!isNullOr(t.categoryId, isString)) return `tasks[${index}].categoryId must be a string or null`;
  if (!isNullOr(t.icon, isString)) return `tasks[${index}].icon must be a string or null`;
  if (typeof t.completed !== 'boolean') return `tasks[${index}].completed must be a boolean`;
  if (!isNullOr(t.reminderMinutesBefore, (v): v is number => typeof v === 'number')) {
    return `tasks[${index}].reminderMinutesBefore must be a number or null`;
  }
  if (!isString(t.createdAt)) return `tasks[${index}].createdAt must be a string`;
  return null;
}

// The security boundary between an untrusted file on disk and rows written
// straight into the DB (src/db/backup.ts). Any invalid row fails the whole
// file — never a partial import — and the error names the exact field so the
// Settings screen can show it verbatim.
export function parseBackup(raw: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Backup file is not a valid object.' };
  }
  const data = parsed as Record<string, unknown>;

  if (data.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'This file is not a Tab Tasks backup.' };
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    return { ok: false, error: `This backup was made by a newer version of the app (v${String(data.version)}).` };
  }
  if (!Array.isArray(data.categories)) {
    return { ok: false, error: '"categories" must be an array.' };
  }
  if (!Array.isArray(data.tasks)) {
    return { ok: false, error: '"tasks" must be an array.' };
  }

  for (let i = 0; i < data.categories.length; i++) {
    const error = validateCategory(data.categories[i], i);
    if (error) return { ok: false, error };
  }
  for (let i = 0; i < data.tasks.length; i++) {
    const error = validateTask(data.tasks[i], i);
    if (error) return { ok: false, error };
  }

  return {
    ok: true,
    data: {
      format: BACKUP_FORMAT,
      version: data.version,
      schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : 0,
      appVersion: typeof data.appVersion === 'string' ? data.appVersion : 'unknown',
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
      categories: data.categories as CategoryRecord[],
      tasks: data.tasks as TaskRecord[],
    },
  };
}
