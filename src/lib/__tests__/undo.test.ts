import { undoToastMessage, type PendingUndo } from '../undo';
import type { TaskWithCategory } from '../types';

function task(status: TaskWithCategory['status']): TaskWithCategory {
  return {
    id: 't1',
    title: 'Task',
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

  it('says "Task deleted" for a pending delete', () => {
    const pending: PendingUndo = { kind: 'delete', task: task('todo') };
    expect(undoToastMessage(pending)).toBe('Task deleted');
  });

  it('says "Task completed" when the previous status was not done', () => {
    const pending: PendingUndo = { kind: 'status', task: task('done'), previousStatus: 'todo' };
    expect(undoToastMessage(pending)).toBe('Task completed');
  });

  it('says "Task reopened" when the previous status was done', () => {
    const pending: PendingUndo = { kind: 'status', task: task('todo'), previousStatus: 'done' };
    expect(undoToastMessage(pending)).toBe('Task reopened');
  });
});
