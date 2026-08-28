import {
  continuousMonthRange,
  continuousWeekRange,
  formatWeekRangeLabel,
  monthGrid,
  monthGridRange,
  sumTaskCounts,
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

describe('continuousWeekRange', () => {
  it('returns one week-start Date per week, in order, 7 days apart', () => {
    const weeks = continuousWeekRange(new Date(2026, 7, 21), 1, 2); // Fri Aug 21 2026
    expect(weeks).toHaveLength(4); // 1 back + anchor's week + 2 forward
    for (let i = 1; i < weeks.length; i++) {
      const gap = (weeks[i].getTime() - weeks[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      expect(gap).toBe(7);
    }
  });

  it("anchors weeksBack=0/weeksForward=0 to exactly the anchor's own week", () => {
    const weeks = continuousWeekRange(new Date(2026, 7, 21), 0, 0); // Fri Aug 21 2026
    expect(weeks).toHaveLength(1);
    expect(toDateString(weeks[0])).toBe('2026-08-16'); // Sunday-start of that week
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

describe('sumTaskCounts', () => {
  it('sums counts for the given keys, defaulting missing keys to 0', () => {
    const counts = { '2026-08-16': 2, '2026-08-18': 1 };
    const total = sumTaskCounts(counts, weekDays(new Date(2026, 7, 21)));
    expect(total).toBe(3);
  });

  it('returns 0 for an empty count map', () => {
    expect(sumTaskCounts({}, weekDays(new Date(2026, 7, 21)))).toBe(0);
  });
});
