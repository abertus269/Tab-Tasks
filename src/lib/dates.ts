import { addDays, addMonths, eachDayOfInterval, format, startOfMonth, startOfWeek, subMonths } from 'date-fns';

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

export function currentYearString(): string {
  return format(new Date(), 'yyyy');
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

// A stable 6x7 grid of 'yyyy-MM-dd' strings (always 42 cells, spanning into the
// adjacent months at the edges) so the Month view never resizes between a
// 5-week and 6-week month.
export function monthGrid(anchor: Date, weekStartsOn: 0 | 1 = 0): string[][] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn });
  const days = eachDayOfInterval({ start, end: addDays(start, 41) }).map(toDateString);
  const rows: string[][] = [];
  for (let i = 0; i < 42; i += 7) {
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

// Su/M/Tu/W/Th/F/Sa — disambiguates Tue vs Thu and Sat vs Sun, unlike a
// single-letter weekday header. Indexed by Date#getDay() (0 = Sunday).
export const WEEKDAY_ABBR = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const;

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

// The week-start Dates from `weeksBack` weeks before `anchor`'s week through
// `weeksForward` weeks after it — Week view's list-of-weeks continuous scroll.
// Parallels continuousMonthRange exactly, one level finer-grained.
export function continuousWeekRange(anchor: Date, weeksBack: number, weeksForward: number): Date[] {
  const start = addDays(startOfWeek(anchor, { weekStartsOn: 0 }), -7 * weeksBack);
  const weeks: Date[] = [];
  for (let i = 0; i <= weeksBack + weeksForward; i++) {
    weeks.push(addDays(start, 7 * i));
  }
  return weeks;
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

// Sums a per-date count map (e.g. from useTaskCountsInRange) over an
// arbitrary list of 'yyyy-MM-dd' keys — pulled out of the week-list view so
// the aggregation itself is unit-testable independent of React/FlatList.
export function sumTaskCounts(dayCounts: Record<string, number>, dateStrs: string[]): number {
  return dateStrs.reduce((sum, d) => sum + (dayCounts[d] ?? 0), 0);
}
