import { subMinutes } from 'date-fns';

import { parseDateString } from './dates';

export interface ReminderOption {
  minutesBefore: number | null;
  label: string;
}

// None first so a new task defaults to no reminder; order is also the
// left-to-right order of the task form's reminder chips.
export const REMINDER_OPTIONS: ReminderOption[] = [
  { minutesBefore: null, label: 'None' },
  { minutesBefore: 0, label: 'At due time' },
  { minutesBefore: 10, label: '10 min before' },
  { minutesBefore: 60, label: '1 hour before' },
  { minutesBefore: 1440, label: '1 day before' },
];

// A task with no dueTime still needs a wall-clock instant to fire a reminder
// from — anchoring at 9am keeps "1 day before" a same-morning reminder rather
// than firing at midnight.
export const UNTIMED_REMINDER_HOUR = 9;

export function reminderLabel(minutesBefore: number | null): string {
  return REMINDER_OPTIONS.find((o) => o.minutesBefore === minutesBefore)?.label ?? 'None';
}

// The exact instant a task's reminder should fire, or null when reminders are
// off. Must go through parseDateString (not `new Date(dueDate)`) — see
// dates.ts — so the anchor lands on the intended calendar day in every
// timezone before the offset is subtracted.
export function reminderFireDate(
  dueDate: string,
  dueTime: string | null,
  minutesBefore: number | null,
): Date | null {
  if (minutesBefore === null) return null;

  const base = parseDateString(dueDate);
  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number);
    base.setHours(hours, minutes, 0, 0);
  } else {
    base.setHours(UNTIMED_REMINDER_HOUR, 0, 0, 0);
  }

  return subMinutes(base, minutesBefore);
}
