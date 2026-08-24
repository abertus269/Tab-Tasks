import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, startOfWeek, subMonths } from 'date-fns';

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

// The continuous run of 'yyyy-MM-dd' strings from `monthsBack` months before
// `anchor`'s month through `monthsForward` months after it — the day list
// backing Week view's continuous scroll (no prev/next pagination).
export function continuousDayRange(anchor: Date, monthsBack: number, monthsForward: number): string[] {
  const start = startOfMonth(subMonths(anchor, monthsBack));
  const end = endOfMonth(addMonths(anchor, monthsForward));
  return eachDayOfInterval({ start, end }).map(toDateString);
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
