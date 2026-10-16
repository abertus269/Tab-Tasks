import {
  continuousMonthRange,
  formatWeekRangeLabel,
  monthGrid,
  monthGridRange,
  monthTotalsForYear,
  toDateString,
  weekdayAbbr,
  weekDays,
} from '../dates';

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
  it('is whole weeks: every row is 7 wide', () => {
    for (const month of [0, 1, 7, 9]) {
      monthGrid(new Date(2026, month, 1)).forEach((row) => expect(row).toHaveLength(7));
    }
  });

  it('uses only the rows the month needs: 4, 5 or 6', () => {
    // Feb 2026 starts on a Sunday and has 28 days: exactly four weeks.
    expect(monthGrid(new Date(2026, 1, 1))).toHaveLength(4);
    // Oct 2026 starts on a Thursday: 4 leading + 31 days = 35 cells.
    expect(monthGrid(new Date(2026, 9, 1))).toHaveLength(5);
    // Aug 2026 starts on a Saturday: 6 leading + 31 days = 37 cells.
    expect(monthGrid(new Date(2026, 7, 1))).toHaveLength(6);
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

  it('ends the grid in the week that holds the last day, never a whole extra week', () => {
    // Oct 31 2026 is a Saturday, so the last row ends exactly on it.
    const grid = monthGrid(new Date(2026, 9, 1));
    expect(grid[grid.length - 1][6]).toBe('2026-10-31');
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
    expect(range.end).toBe(grid[grid.length - 1][6]);
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
    expect(labels).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
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

describe('formatWeekRangeLabel', () => {
  it('formats a same-month week as "MMM d – d"', () => {
    expect(formatWeekRangeLabel(new Date(2026, 7, 24))).toBe('Aug 23 – 29');
  });

  it('formats a cross-month week as "MMM d – MMM d"', () => {
    // Week of Aug 30 2026 (Sun) runs Aug 30 – Sep 5.
    expect(formatWeekRangeLabel(new Date(2026, 7, 31))).toBe('Aug 30 – Sep 5');
  });

  it('formats a cross-year week with both years spelled out', () => {
    // 2026-12-27 is a Sunday; that week runs Dec 27 2026 – Jan 2 2027.
    expect(formatWeekRangeLabel(new Date(2026, 11, 29))).toBe('Dec 27, 2026 – Jan 2, 2027');
  });
});

describe('monthTotalsForYear', () => {
  it('returns 12 totals, January first, defaulting empty months to 0', () => {
    const totals = monthTotalsForYear({}, 2026);
    expect(totals).toHaveLength(12);
    expect(totals.every((n) => n === 0)).toBe(true);
  });

  it('sums the per-day counts into their month', () => {
    const counts = { '2026-01-05': 2, '2026-01-31': 1, '2026-10-17': 3, '2026-12-01': 4 };
    const totals = monthTotalsForYear(counts, 2026);
    expect(totals[0]).toBe(3);
    expect(totals[9]).toBe(3);
    expect(totals[11]).toBe(4);
    expect(totals[1]).toBe(0);
  });

  it('ignores dates from other years', () => {
    const counts = { '2025-10-17': 5, '2027-10-17': 7, '2026-10-17': 1 };
    expect(monthTotalsForYear(counts, 2026)[9]).toBe(1);
  });
});
