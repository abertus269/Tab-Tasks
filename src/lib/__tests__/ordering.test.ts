import { compareTasks, withListDividers, type OrderableTask } from '../ordering';

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

describe('withListDividers', () => {
  const today = '2026-08-21';

  it('places the Today divider at the top when nothing is overdue, and adds Upcoming after today', () => {
    const tasks = [task({ dueDate: '2026-08-21' }), task({ dueDate: '2026-08-22' })];
    const rows = withListDividers(tasks, today);
    expect(rows).toEqual([
      { type: 'divider', kind: 'today' },
      { type: 'task', task: tasks[0] },
      { type: 'divider', kind: 'upcoming' },
      { type: 'task', task: tasks[1] },
    ]);
  });

  it('places the Today divider at the end, with no Upcoming divider, when everything is overdue', () => {
    const tasks = [task({ dueDate: '2026-08-19' }), task({ dueDate: '2026-08-20' })];
    const rows = withListDividers(tasks, today);
    expect(rows).toEqual([
      { type: 'task', task: tasks[0] },
      { type: 'task', task: tasks[1] },
      { type: 'divider', kind: 'today' },
    ]);
  });

  it('places Today between overdue and current tasks, and Upcoming before future tasks', () => {
    const tasks = [
      task({ dueDate: '2026-08-19' }),
      task({ dueDate: '2026-08-20' }),
      task({ dueDate: '2026-08-21' }),
      task({ dueDate: '2026-08-25' }),
    ];
    const rows = withListDividers(tasks, today);
    expect(rows[2]).toEqual({ type: 'divider', kind: 'today' });
    expect(rows[0]).toMatchObject({ type: 'task', task: { dueDate: '2026-08-19' } });
    expect(rows[3]).toMatchObject({ type: 'task', task: { dueDate: '2026-08-21' } });
    expect(rows[4]).toEqual({ type: 'divider', kind: 'upcoming' });
    expect(rows[5]).toMatchObject({ type: 'task', task: { dueDate: '2026-08-25' } });
  });

  it('places the Today divider at the top for an empty list, with no Upcoming divider', () => {
    const rows = withListDividers([], today);
    expect(rows).toEqual([{ type: 'divider', kind: 'today' }]);
  });

  it('inserts an emptyToday row between Today and Upcoming when nothing is due today but a future task exists', () => {
    const tasks = [task({ dueDate: '2026-08-19' }), task({ dueDate: '2026-08-25' })];
    const rows = withListDividers(tasks, today);
    expect(rows).toEqual([
      { type: 'task', task: tasks[0] },
      { type: 'divider', kind: 'today' },
      { type: 'emptyToday' },
      { type: 'divider', kind: 'upcoming' },
      { type: 'task', task: tasks[1] },
    ]);
  });

  it('has no future tasks and nothing due today -> just the Today divider, no emptyToday row', () => {
    const tasks = [task({ dueDate: '2026-08-19' })];
    const rows = withListDividers(tasks, today);
    expect(rows).toEqual([{ type: 'task', task: tasks[0] }, { type: 'divider', kind: 'today' }]);
  });
});
