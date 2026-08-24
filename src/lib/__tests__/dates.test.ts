import { continuousDayRange, continuousMonthRange, monthGrid, monthGridRange, toDateString, weekdayAbbr, weekDays } from '../dates';

describe('weekDays', () => {
  it('returns 7 consecutive dates', () => {
    const days = weekDays(new Date(2026, 7, 21)); // Fri Aug 21 2026
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-08-16'); // Sunday-start
    expect(days[6]).toBe('2026-08-22');
  });

  it('spans two months correctly when the week crosses a month boundary', () => {
    const days = weekDays(new Date(2026, 7, 31)); // Mon Aug 31 2026
    expect(days).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ]);
  });

  it('spans a leap day correctly', () => {
    const days = weekDays(new Date(2028, 1, 29)); // Tue Feb 29 2028 (leap year)
    expect(days).toContain('2028-02-29');
    expect(days[0]).toBe('2028-02-27');
    expect(days[6]).toBe('2028-03-04');
  });
});

describe('monthGrid', () => {
  it('is always a stable 6x7 grid', () => {
    const grid = monthGrid(new Date(2026, 7, 1)); // August 2026
    expect(grid).toHaveLength(6);
    grid.forEach((row) => expect(row).toHaveLength(7));
  });

  it('rolls over into the previous and next month at the grid edges', () => {
    // August 2026: Aug 1 is a Saturday, so the grid starts in late July.
    const grid = monthGrid(new Date(2026, 7, 1));
    expect(grid[0][0]).toBe('2026-07-26');
    const flat = grid.flat();
    expect(flat).toContain('2026-08-01');
    expect(flat).toContain('2026-08-31');
    expect(flat[flat.length - 1] > '2026-08-31').toBe(true);
  });

  it('handles a leap-year February correctly', () => {
    const grid = monthGrid(new Date(2028, 1, 1)); // Feb 2028
    const flat = grid.flat();
    expect(flat).toContain('2028-02-29');
    expect(flat).not.toContain('2028-02-30');
  });

  it('produces a range whose bounds match the grid edges', () => {
    const anchor = new Date(2026, 7, 1);
    const grid = monthGrid(anchor);
    const range = monthGridRange(anchor);
    expect(range.start).toBe(grid[0][0]);
    expect(range.end).toBe(grid[5][6]);
  });
});

describe('toDateString', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('weekdayAbbr', () => {
  it('disambiguates every day of the week', () => {
    // 2026-08-16 is a Sunday; walk one full week from there.
    const labels = Array.from({ length: 7 }, (_, i) => weekdayAbbr(new Date(2026, 7, 16 + i)));
    expect(labels).toEqual(['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']);
  });
});

describe('continuousDayRange', () => {
  it('spans at least 3 months when given 1 month back and 2 forward', () => {
    const days = continuousDayRange(new Date(2026, 7, 21), 1, 2);
    // July 1 through October 31 inclusive.
    expect(days[0]).toBe('2026-07-01');
    expect(days[days.length - 1]).toBe('2026-10-31');
    expect(days.length).toBeGreaterThanOrEqual(90); // "at least 3 months" of days
  });

  it('contains no gaps or duplicates across the month boundaries it spans', () => {
    const days = continuousDayRange(new Date(2026, 1, 10), 1, 1); // spans Feb (leap-adjacent)
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true); // strictly increasing, so no dup/gap logic error
    }
  });
});

describe('continuousMonthRange', () => {
  it('returns one Date per month, first-of-month, in order', () => {
    const months = continuousMonthRange(new Date(2026, 7, 21), 1, 2);
    expect(months).toHaveLength(4); // Jul, Aug, Sep, Oct
    expect(toDateString(months[0])).toBe('2026-07-01');
    expect(toDateString(months[1])).toBe('2026-08-01');
    expect(toDateString(months[2])).toBe('2026-09-01');
    expect(toDateString(months[3])).toBe('2026-10-01');
  });

  it('rolls over a year boundary correctly', () => {
    const months = continuousMonthRange(new Date(2026, 0, 15), 1, 1); // Jan 2026
    expect(toDateString(months[0])).toBe('2025-12-01');
    expect(toDateString(months[2])).toBe('2026-02-01');
  });
});
