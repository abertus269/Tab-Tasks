import { compareTasks, withTodayDivider, type OrderableTask } from '../ordering';

function task(overrides: Partial<OrderableTask> = {}): OrderableTask {
  return {
    dueDate: '2026-08-21',
    dueTime: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('compareTasks', () => {
  it('sorts by dueDate ascending first', () => {
    const earlier = task({ dueDate: '2026-08-01' });
    const later = task({ dueDate: '2026-08-02' });
    expect(compareTasks(earlier, later)).toBeLessThan(0);
    expect(compareTasks(later, earlier)).toBeGreaterThan(0);
  });

  it('places an untimed task before a timed task on the same date', () => {
    const untimed = task({ dueTime: null });
    const timed = task({ dueTime: '09:00' });
    expect(compareTasks(untimed, timed)).toBeLessThan(0);
    expect(compareTasks(timed, untimed)).toBeGreaterThan(0);
  });

  it('sorts timed tasks on the same date by dueTime ascending', () => {
    const early = task({ dueTime: '09:00' });
    const late = task({ dueTime: '17:30' });
    expect(compareTasks(early, late)).toBeLessThan(0);
  });

  it('falls back to createdAt ascending as the final tie-break', () => {
    const first = task({ dueTime: '09:00', createdAt: '2026-01-01T00:00:00.000Z' });
    const second = task({ dueTime: '09:00', createdAt: '2026-06-01T00:00:00.000Z' });
    expect(compareTasks(first, second)).toBeLessThan(0);
  });

  it('treats fully identical tasks as equal', () => {
    expect(compareTasks(task(), task())).toBe(0);
  });
});

describe('withTodayDivider', () => {
  const today = '2026-08-21';

  it('places the divider at the top when nothing is overdue', () => {
    const tasks = [task({ dueDate: '2026-08-21' }), task({ dueDate: '2026-08-22' })];
    const rows = withTodayDivider(tasks, today);
    expect(rows[0]).toEqual({ type: 'divider' });
    expect(rows).toHaveLength(3);
  });

  it('places the divider at the end when everything is overdue', () => {
    const tasks = [task({ dueDate: '2026-08-19' }), task({ dueDate: '2026-08-20' })];
    const rows = withTodayDivider(tasks, today);
    expect(rows[rows.length - 1]).toEqual({ type: 'divider' });
    expect(rows).toHaveLength(3);
  });

  it('places the divider between overdue and current/future tasks', () => {
    const tasks = [
      task({ dueDate: '2026-08-19' }),
      task({ dueDate: '2026-08-20' }),
      task({ dueDate: '2026-08-21' }),
      task({ dueDate: '2026-08-25' }),
    ];
    const rows = withTodayDivider(tasks, today);
    expect(rows[2]).toEqual({ type: 'divider' });
    expect(rows[0]).toMatchObject({ type: 'task', task: { dueDate: '2026-08-19' } });
    expect(rows[3]).toMatchObject({ type: 'task', task: { dueDate: '2026-08-21' } });
  });

  it('places the divider at the top for an empty list', () => {
    const rows = withTodayDivider([], today);
    expect(rows).toEqual([{ type: 'divider' }]);
  });
});
