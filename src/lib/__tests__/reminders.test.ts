import { cycleReminderOption, reminderFireDate, reminderLabel, REMINDER_OPTIONS } from '../reminders';

describe('reminderFireDate', () => {
  it('returns null when there is no reminder', () => {
    expect(reminderFireDate('2026-08-24', '18:00', null)).toBeNull();
  });

  it('fires exactly at the due time for offset 0', () => {
    const fire = reminderFireDate('2026-08-24', '18:00', 0);
    expect(fire).toEqual(new Date(2026, 7, 24, 18, 0, 0, 0));
  });

  it('subtracts minutes before the due time', () => {
    expect(reminderFireDate('2026-08-24', '18:00', 10)).toEqual(new Date(2026, 7, 24, 17, 50, 0, 0));
    expect(reminderFireDate('2026-08-24', '18:00', 60)).toEqual(new Date(2026, 7, 24, 17, 0, 0, 0));
  });

  it('anchors at 9am when the task has no dueTime', () => {
    expect(reminderFireDate('2026-08-24', null, 0)).toEqual(new Date(2026, 7, 24, 9, 0, 0, 0));
  });

  it('1 day before an untimed task lands the previous morning, not midnight', () => {
    expect(reminderFireDate('2026-08-24', null, 1440)).toEqual(new Date(2026, 7, 23, 9, 0, 0, 0));
  });

  it('crosses a midnight boundary', () => {
    expect(reminderFireDate('2026-08-24', '00:20', 60)).toEqual(new Date(2026, 7, 23, 23, 20, 0, 0));
  });

  it('crosses a month boundary', () => {
    expect(reminderFireDate('2026-09-01', '00:10', 60)).toEqual(new Date(2026, 7, 31, 23, 10, 0, 0));
  });

  it('crosses a US DST fall-back boundary correctly', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      // US DST ended 2026-11-01 at 2am local, clocks fall back to 1am.
      // 1 hour before 2026-11-01 02:30 should land at 2026-11-01 01:30, same day.
      expect(reminderFireDate('2026-11-01', '02:30', 60)).toEqual(new Date(2026, 10, 1, 1, 30, 0, 0));
    } finally {
      process.env.TZ = originalTz;
    }
  });
});

describe('reminderLabel', () => {
  it('labels every option, and falls back to None for an unknown value', () => {
    expect(reminderLabel(null)).toBe('None');
    expect(reminderLabel(0)).toBe('At due time');
    expect(reminderLabel(10)).toBe('10 min before');
    expect(reminderLabel(60)).toBe('1 hour before');
    expect(reminderLabel(1440)).toBe('1 day before');
    expect(reminderLabel(999)).toBe('None');
  });
});

describe('cycleReminderOption', () => {
  it('steps through every option in order and wraps back to None', () => {
    const order = REMINDER_OPTIONS.map((o) => o.minutesBefore);
    let current: number | null = null;
    for (let i = 0; i < order.length; i++) {
      expect(current).toBe(order[i]);
      current = cycleReminderOption(current);
    }
    expect(current).toBeNull(); // wrapped back to the start
  });
});
