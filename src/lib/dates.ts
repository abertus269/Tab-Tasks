import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  getDaysInMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

export function toDateString(date: Date): string {
  return format(date, DATE_FORMAT);
}

// `new Date('2026-08-21')` parses a date-only ISO string as UTC midnight,
// which can display as the previous day in negative-UTC-offset timezones —
// exactly the class of bug the schema's text-date design exists to avoid.
// Always go through this when turning a stored date string back into a Date.
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayString(): string {
  return toDateString(new Date());
}

// '14:05' -> '2:05 PM'
export function formatTime12h(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export function formatDateLabel(dateStr: string): string {
  return format(parseDateString(dateStr), 'EEE, MMM d');
}

// Compact due-date label for a task row on a merged, multi-date list — 'Today'
// when it matches, otherwise 'MMM d'. Without this, a row's own text never
// states its date, and its position relative to the today-divider (which can
// sit directly above the very next task) reads as "this is due today" even
// when it isn't.
export function formatDueDateShort(dateStr: string): string {
  if (dateStr === todayString()) return 'Today';
  return format(parseDateString(dateStr), 'MMM d');
}

// The 7 'yyyy-MM-dd' strings for the week containing `anchor`, Sunday-first.
export function weekDays(anchor: Date, weekStartsOn: 0 | 1 = 0): string[] {
  const start = startOfWeek(anchor, { weekStartsOn });
  return eachDayOfInterval({ start, end: addDays(start, 6) }).map(toDateString);
}

// The month as rows of 'yyyy-MM-dd' strings — only the weeks it actually
// needs (4 to 6 rows), whole weeks so every row is 7 wide. The cells before
// the 1st and after the last day belong to the adjacent months; MonthGrid
// leaves them blank rather than repeating the next month's first week, which
// the continuous Month scroll already shows right below.
export function monthGrid(anchor: Date, weekStartsOn: 0 | 1 = 0): string[][] {
  const monthStart = startOfMonth(anchor);
  const start = startOfWeek(monthStart, { weekStartsOn });
  const leading = differenceInCalendarDays(monthStart, start);
  const weeks = Math.ceil((leading + getDaysInMonth(monthStart)) / 7);
  const days = eachDayOfInterval({ start, end: addDays(start, weeks * 7 - 1) }).map(toDateString);
  const rows: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }
  return rows;
}

// Query bounds for fetching every task shown in a month grid, including the
// adjacent-month days visible at the grid's edges.
export function monthGridRange(anchor: Date, weekStartsOn: 0 | 1 = 0): { start: string; end: string } {
  const grid = monthGrid(anchor, weekStartsOn);
  return { start: grid[0][0], end: grid[grid.length - 1][6] };
}

// Su/Mo/Tu/We/Th/Fr/Sa — disambiguates Tue vs Thu and Sat vs Sun, unlike a
// single-letter weekday header, and every label is the same two letters wide
// (a mix of M/W/F and Su/Tu/Th read as inconsistent). Indexed by
// Date#getDay() (0 = Sunday).
export const WEEKDAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

export function weekdayAbbr(date: Date): string {
  return WEEKDAY_ABBR[date.getDay()];
}

// The first-of-month Dates from `monthsBack` months before `anchor` through
// `monthsForward` months after it — Month view's continuous scroll.
export function continuousMonthRange(anchor: Date, monthsBack: number, monthsForward: number): Date[] {
  const start = startOfMonth(subMonths(anchor, monthsBack));
  const months: Date[] = [];
  for (let i = 0; i <= monthsBack + monthsForward; i++) {
    months.push(addMonths(start, i));
  }
  return months;
}

// "Aug 24 – 30" (same month) / "Aug 31 – Sep 6" (crosses a month) /
// "Dec 29, 2026 – Jan 4, 2027" (crosses a year, rare but possible) — the
// week-list row label. Always built from weekDays() so it can never disagree
// with the 7 dates that actually back the row's task count.
export function formatWeekRangeLabel(weekStart: Date, weekStartsOn: 0 | 1 = 0): string {
  const days = weekDays(weekStart, weekStartsOn);
  const start = parseDateString(days[0]);
  const end = parseDateString(days[6]);

  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'd')}`;
}

// Task totals for each month of `year` (index 0 = January), from a per-date
// count map such as useTaskCountsInRange's — the Year view's month tiles.
export function monthTotalsForYear(dayCounts: Record<string, number>, year: number): number[] {
  const totals = new Array<number>(12).fill(0);
  const prefix = `${year}-`;
  for (const [date, count] of Object.entries(dayCounts)) {
    if (!date.startsWith(prefix)) continue;
    totals[Number(date.slice(5, 7)) - 1] += count;
  }
  return totals;
}
