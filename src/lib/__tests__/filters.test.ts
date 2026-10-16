import {
  COMPLETED_FILTER,
  emptyMessageFor,
  filterTasks,
  inCategoryScope,
  matchesFilter,
  splitNowTasks,
  type FilterableTask,
} from '../filters';

function task(overrides: Partial<FilterableTask> = {}): FilterableTask {
  return { categoryId: null, status: 'todo', ...overrides };
}

describe('inCategoryScope', () => {
  it('ignores status — a done task is still in scope for its category', () => {
    expect(inCategoryScope(task({ categoryId: 'work', status: 'done' }), 'work')).toBe(true);
  });

  it("'all' and 'completed' scope everything regardless of category", () => {
    expect(inCategoryScope(task({ categoryId: 'work' }), 'all')).toBe(true);
    expect(inCategoryScope(task({ categoryId: null }), 'all')).toBe(true);
    expect(inCategoryScope(task({ categoryId: 'work' }), COMPLETED_FILTER)).toBe(true);
  });

  it("'uncategorized' only scopes tasks with no category", () => {
    expect(inCategoryScope(task({ categoryId: null }), 'uncategorized')).toBe(true);
    expect(inCategoryScope(task({ categoryId: 'work' }), 'uncategorized')).toBe(false);
  });

  it('a category id only scopes tasks in that category', () => {
    expect(inCategoryScope(task({ categoryId: 'work' }), 'work')).toBe(true);
    expect(inCategoryScope(task({ categoryId: 'home' }), 'work')).toBe(false);
  });
});

describe('matchesFilter', () => {
  it("'all' hides done tasks but keeps todo and active", () => {
    expect(matchesFilter(task({ status: 'todo' }), 'all')).toBe(true);
    expect(matchesFilter(task({ status: 'active' }), 'all')).toBe(true);
    expect(matchesFilter(task({ status: 'done' }), 'all')).toBe(false);
  });

  it("'completed' keeps only done tasks, across every category", () => {
    expect(matchesFilter(task({ status: 'done', categoryId: 'work' }), COMPLETED_FILTER)).toBe(true);
    expect(matchesFilter(task({ status: 'done', categoryId: null }), COMPLETED_FILTER)).toBe(true);
    expect(matchesFilter(task({ status: 'todo' }), COMPLETED_FILTER)).toBe(false);
  });

  it('a category filter keeps only not-done tasks in that category', () => {
    expect(matchesFilter(task({ status: 'todo', categoryId: 'work' }), 'work')).toBe(true);
    expect(matchesFilter(task({ status: 'done', categoryId: 'work' }), 'work')).toBe(false);
    expect(matchesFilter(task({ status: 'todo', categoryId: 'home' }), 'work')).toBe(false);
  });

  it("'uncategorized' keeps only not-done tasks with no category", () => {
    expect(matchesFilter(task({ status: 'todo', categoryId: null }), 'uncategorized')).toBe(true);
    expect(matchesFilter(task({ status: 'done', categoryId: null }), 'uncategorized')).toBe(false);
    expect(matchesFilter(task({ status: 'todo', categoryId: 'work' }), 'uncategorized')).toBe(false);
  });
});

describe('filterTasks', () => {
  it('preserves order and applies matchesFilter', () => {
    const tasks = [
      task({ status: 'todo', categoryId: 'work' }),
      task({ status: 'done', categoryId: 'work' }),
      task({ status: 'active', categoryId: null }),
    ];
    expect(filterTasks(tasks, 'all')).toEqual([tasks[0], tasks[2]]);
    expect(filterTasks(tasks, COMPLETED_FILTER)).toEqual([tasks[1]]);
    expect(filterTasks(tasks, 'work')).toEqual([tasks[0]]);
  });
});

describe('splitNowTasks', () => {
  it('lifts only active tasks into now, keeping each half in its incoming order', () => {
    const tasks = [
      { id: 'a', status: 'todo' as const },
      { id: 'b', status: 'active' as const },
      { id: 'c', status: 'todo' as const },
      { id: 'd', status: 'active' as const },
    ];
    const { now, rest } = splitNowTasks(tasks);
    expect(now.map((t) => t.id)).toEqual(['b', 'd']);
    expect(rest.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('returns an empty now when nothing is active', () => {
    const tasks = [{ status: 'todo' as const }, { status: 'done' as const }];
    const { now, rest } = splitNowTasks(tasks);
    expect(now).toEqual([]);
    expect(rest).toEqual(tasks);
  });

  it('never drops or duplicates a task', () => {
    const tasks = [
      { id: 'a', status: 'active' as const },
      { id: 'b', status: 'todo' as const },
      { id: 'c', status: 'done' as const },
    ];
    const { now, rest } = splitNowTasks(tasks);
    expect(now.length + rest.length).toBe(tasks.length);
  });

  it('handles an empty list', () => {
    expect(splitNowTasks([])).toEqual({ now: [], rest: [] });
  });
});

describe('emptyMessageFor', () => {
  it("'completed' with nothing done", () => {
    expect(emptyMessageFor(COMPLETED_FILTER, false)).toBe('No completed tasks yet.');
  });

  it('tasks exist in scope but all are done -> "All done."', () => {
    expect(emptyMessageFor('all', true)).toBe('All done.');
    expect(emptyMessageFor('work', true)).toBe('All done.');
  });

  it("'all' with nothing in scope at all -> \"No tasks yet.\"", () => {
    expect(emptyMessageFor('all', false)).toBe('No tasks yet.');
  });

  it('a category/uncategorized filter with nothing in scope -> "No tasks in this category."', () => {
    expect(emptyMessageFor('work', false)).toBe('No tasks in this category.');
    expect(emptyMessageFor('uncategorized', false)).toBe('No tasks in this category.');
  });
});
