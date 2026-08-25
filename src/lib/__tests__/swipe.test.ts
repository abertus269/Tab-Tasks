import { shouldDeleteOnRelease, swipeProgress } from '../swipe';

const ROW_WIDTH = 300;

describe('shouldDeleteOnRelease', () => {
  it('springs back on a small drag with no velocity', () => {
    expect(shouldDeleteOnRelease(40, 0, ROW_WIDTH)).toBe(false);
  });

  it('deletes once translation crosses the 40% ratio', () => {
    expect(shouldDeleteOnRelease(ROW_WIDTH * 0.4, 0, ROW_WIDTH)).toBe(true);
    expect(shouldDeleteOnRelease(ROW_WIDTH * 0.39, 0, ROW_WIDTH)).toBe(false);
  });

  it('deletes leftward past the ratio too — both directions delete', () => {
    expect(shouldDeleteOnRelease(-ROW_WIDTH * 0.4, 0, ROW_WIDTH)).toBe(true);
    expect(shouldDeleteOnRelease(-ROW_WIDTH * 0.39, 0, ROW_WIDTH)).toBe(false);
  });

  it('deletes on a fast flick past the shorter 20% travel', () => {
    expect(shouldDeleteOnRelease(ROW_WIDTH * 0.25, 900, ROW_WIDTH)).toBe(true);
    expect(shouldDeleteOnRelease(-ROW_WIDTH * 0.25, -900, ROW_WIDTH)).toBe(true);
  });

  it('does not delete a fast flick that has not traveled 20% yet', () => {
    expect(shouldDeleteOnRelease(ROW_WIDTH * 0.1, 900, ROW_WIDTH)).toBe(false);
  });

  it('ignores velocity that opposes the drag direction', () => {
    expect(shouldDeleteOnRelease(ROW_WIDTH * 0.25, -900, ROW_WIDTH)).toBe(false);
  });

  it('never deletes before the row has been measured', () => {
    expect(shouldDeleteOnRelease(1000, 5000, 0)).toBe(false);
  });
});

describe('swipeProgress', () => {
  it('is 0 at rest', () => {
    expect(swipeProgress(0, ROW_WIDTH)).toBe(0);
  });

  it('reaches 1 exactly at the delete ratio and clamps beyond it', () => {
    expect(swipeProgress(ROW_WIDTH * 0.4, ROW_WIDTH)).toBe(1);
    expect(swipeProgress(ROW_WIDTH * 0.8, ROW_WIDTH)).toBe(1);
  });

  it('is symmetric for leftward drags', () => {
    expect(swipeProgress(-ROW_WIDTH * 0.2, ROW_WIDTH)).toBeCloseTo(0.5);
  });

  it('is 0 before the row has been measured', () => {
    expect(swipeProgress(50, 0)).toBe(0);
  });
});
