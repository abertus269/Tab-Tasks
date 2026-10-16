import { undoToastMessage, type PendingUndo } from '../undo';
import type { TaskWithCategory } from '../types';

function task(status: TaskWithCategory['status'], title = 'Task'): TaskWithCategory {
  return {
    id: 't1',
    title,
    dueDate: '2026-08-21',
    dueTime: null,
    description: null,
    categoryId: null,
    icon: null,
    status,
    reminderMinutesBefore: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    category: null,
  };
}

describe('undoToastMessage', () => {
  it('returns an empty string when nothing is pending', () => {
    expect(undoToastMessage(null)).toBe('');
  });

  it('names the task for a pending delete', () => {
    const pending: PendingUndo = { kind: 'delete', task: task('todo', 'MTH Final exam') };
    expect(undoToastMessage(pending)).toBe('Deleted “MTH Final exam”');
  });

  it('says "Finished" when the previous status was not done', () => {
    const pending: PendingUndo = { kind: 'status', task: task('done', 'Pay rent'), previousStatus: 'todo' };
    expect(undoToastMessage(pending)).toBe('Finished “Pay rent”');
  });

  it('says "Finished" for a task that was active (Now) when completed', () => {
    const pending: PendingUndo = { kind: 'status', task: task('done', 'Pay rent'), previousStatus: 'active' };
    expect(undoToastMessage(pending)).toBe('Finished “Pay rent”');
  });

  it('says "Reopened" when the previous status was done', () => {
    const pending: PendingUndo = { kind: 'status', task: task('todo', 'Pay rent'), previousStatus: 'done' };
    expect(undoToastMessage(pending)).toBe('Reopened “Pay rent”');
  });

  it('trims surrounding whitespace in the title', () => {
    const pending: PendingUndo = { kind: 'delete', task: task('todo', '  Pay rent  ') };
    expect(undoToastMessage(pending)).toBe('Deleted “Pay rent”');
  });

  it('cuts a long title with an ellipsis so the Undo button keeps its room', () => {
    const long = 'Call the landlord about the broken heating in the flat';
    const message = undoToastMessage({ kind: 'delete', task: task('todo', long) });
    expect(message).toBe('Deleted “Call the landlord about…”');
    expect(message.length).toBeLessThan(long.length);
  });

  it('leaves a title at exactly the limit untouched', () => {
    const exact = 'a'.repeat(26);
    expect(undoToastMessage({ kind: 'delete', task: task('todo', exact) })).toBe(`Deleted “${exact}”`);
  });
});
