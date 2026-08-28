import { nextStatus } from '../status';

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
