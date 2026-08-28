import { shouldCompleteOnRelease, swipeProgress } from '../swipe';

const ROW_WIDTH = 300;

describe('shouldCompleteOnRelease', () => {
  it('springs back on a small drag with no velocity', () => {
    expect(shouldCompleteOnRelease(40, 0, ROW_WIDTH)).toBe(false);
  });

  it('completes once translation crosses the 40% ratio', () => {
    expect(shouldCompleteOnRelease(ROW_WIDTH * 0.4, 0, ROW_WIDTH)).toBe(true);
    expect(shouldCompleteOnRelease(ROW_WIDTH * 0.39, 0, ROW_WIDTH)).toBe(false);
  });

  it('completes leftward past the ratio too — both directions complete', () => {
    expect(shouldCompleteOnRelease(-ROW_WIDTH * 0.4, 0, ROW_WIDTH)).toBe(true);
    expect(shouldCompleteOnRelease(-ROW_WIDTH * 0.39, 0, ROW_WIDTH)).toBe(false);
  });

  it('completes on a fast flick past the shorter 20% travel', () => {
    expect(shouldCompleteOnRelease(ROW_WIDTH * 0.25, 900, ROW_WIDTH)).toBe(true);
    expect(shouldCompleteOnRelease(-ROW_WIDTH * 0.25, -900, ROW_WIDTH)).toBe(true);
  });

  it('does not complete a fast flick that has not traveled 20% yet', () => {
    expect(shouldCompleteOnRelease(ROW_WIDTH * 0.1, 900, ROW_WIDTH)).toBe(false);
  });

  it('ignores velocity that opposes the drag direction', () => {
    expect(shouldCompleteOnRelease(ROW_WIDTH * 0.25, -900, ROW_WIDTH)).toBe(false);
  });

  it('never completes before the row has been measured', () => {
    expect(shouldCompleteOnRelease(1000, 5000, 0)).toBe(false);
  });
});

describe('swipeProgress', () => {
  it('is 0 at rest', () => {
    expect(swipeProgress(0, ROW_WIDTH)).toBe(0);
  });

  it('reaches 1 exactly at the complete ratio and clamps beyond it', () => {
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
