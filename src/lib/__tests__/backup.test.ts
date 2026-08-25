import { BACKUP_FORMAT, BACKUP_VERSION, buildBackup, parseBackup } from '../backup';
import type { CategoryRecord, TaskRecord } from '../types';

function category(overrides: Partial<CategoryRecord> = {}): CategoryRecord {
  return { id: 'cat-1', name: 'Studies', color: '#A8F0C6', icon: 'graduation-cap', ...overrides };
}

function task(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 'task-1',
    title: 'Do the reading',
    dueDate: '2026-08-25',
    dueTime: '10:00',
    description: null,
    categoryId: 'cat-1',
    icon: null,
    completed: false,
    reminderMinutesBefore: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildBackup + parseBackup round-trip', () => {
  it('parses back exactly what buildBackup wrote', () => {
    const built = buildBackup([category()], [task()], { schemaVersion: 2, appVersion: '1.0.0' });
    const result = parseBackup(JSON.stringify(built));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.format).toBe(BACKUP_FORMAT);
    expect(result.data.version).toBe(BACKUP_VERSION);
    expect(result.data.categories).toEqual([category()]);
    expect(result.data.tasks).toEqual([task()]);
  });
});

describe('parseBackup validation', () => {
  it('rejects malformed JSON', () => {
    const result = parseBackup('{not json');
    expect(result).toEqual({ ok: false, error: 'File is not valid JSON.' });
  });

  it('rejects a file with the wrong format tag', () => {
    const result = parseBackup(JSON.stringify({ format: 'some-other-app', version: 1, categories: [], tasks: [] }));
    expect(result.ok).toBe(false);
  });

  it('rejects a version newer than this app supports', () => {
    const result = parseBackup(
      JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION + 1, categories: [], tasks: [] }),
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a non-array tasks field', () => {
    const result = parseBackup(
      JSON.stringify({ format: BACKUP_FORMAT, version: 1, categories: [], tasks: 'nope' }),
    );
    expect(result).toEqual({ ok: false, error: '"tasks" must be an array.' });
  });

  it('rejects a bad dueDate on a single task and fails the whole file', () => {
    const built = buildBackup([], [task({ dueDate: '08/25/2026' })], { schemaVersion: 2, appVersion: '1.0.0' });
    const result = parseBackup(JSON.stringify(built));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('dueDate');
  });

  it('rejects a category with an invalid color', () => {
    const built = buildBackup([category({ color: 'green' })], [], { schemaVersion: 2, appVersion: '1.0.0' });
    const result = parseBackup(JSON.stringify(built));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('color');
  });

  it('accepts a null dueTime, description, categoryId, icon, and reminderMinutesBefore', () => {
    const built = buildBackup(
      [],
      [task({ dueTime: null, description: null, categoryId: null, icon: null, reminderMinutesBefore: null })],
      { schemaVersion: 2, appVersion: '1.0.0' },
    );
    const result = parseBackup(JSON.stringify(built));
    expect(result.ok).toBe(true);
  });
});
