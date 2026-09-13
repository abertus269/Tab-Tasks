import { crossesDone, isDone, nextStatus, type TaskStatus } from '../status';

describe('nextStatus', () => {
  describe('cycle enabled', () => {
    it('walks todo -> active -> done -> todo', () => {
      expect(nextStatus('todo', true)).toBe('active');
      expect(nextStatus('active', true)).toBe('done');
      expect(nextStatus('done', true)).toBe('todo');
    });
  });

  describe('cycle disabled', () => {
    it('is a plain done/not-done toggle', () => {
      expect(nextStatus('todo', false)).toBe('done');
      expect(nextStatus('active', false)).toBe('done');
      expect(nextStatus('done', false)).toBe('todo');
    });
  });
});

describe('isDone', () => {
  it('is true only for done', () => {
    expect(isDone('done')).toBe(true);
    expect(isDone('todo')).toBe(false);
    expect(isDone('active')).toBe(false);
  });
});

describe('crossesDone', () => {
  it('is false within the not-done states', () => {
    expect(crossesDone('todo', 'active')).toBe(false);
    expect(crossesDone('active', 'todo')).toBe(false);
  });

  it('is true whenever done is entered or left', () => {
    expect(crossesDone('active', 'done')).toBe(true);
    expect(crossesDone('todo', 'done')).toBe(true);
    expect(crossesDone('done', 'todo')).toBe(true);
    expect(crossesDone('done', 'active')).toBe(true);
  });

  it('is false for a no-op change', () => {
    expect(crossesDone('done', 'done')).toBe(false);
    expect(crossesDone('todo', 'todo')).toBe(false);
  });
});

describe('crossesDone + nextStatus invariant', () => {
  // useTaskRowActions.cycleStatus relies on this: whenever a tap's status
  // change would cross the done boundary, it's safe to hand off to the same
  // plain-flip write a swipe uses (nextStatus(s, false)) instead of the
  // 3-step cycle's own target — the two agree exactly in that case.
  const statuses: TaskStatus[] = ['todo', 'active', 'done'];

  it('nextStatus(s, cycle) equals nextStatus(s, false) whenever it crosses done', () => {
    for (const status of statuses) {
      for (const cycleEnabled of [true, false]) {
        const next = nextStatus(status, cycleEnabled);
        if (crossesDone(status, next)) {
          expect(next).toBe(nextStatus(status, false));
        }
      }
    }
  });
});
