import { addDays, format } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateNavHeader } from './DateNavHeader';
import { EmptyState } from '@/components/EmptyState';
import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import { useTasksInRange } from '@/hooks/useTasks';
import { formatWeekRangeLabel, parseDateString, todayString, weekDays, weekdayAbbr } from '@/lib/dates';
import type { CompleteBehavior, RegisterRowExit, RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, minTouchTarget, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  anchorDate: Date;
  onNavigate: (date: Date) => void;
  // Tapping a day in the strip opens it in the Day view.
  onSelectDate: (date: Date) => void;
  completeBehavior: CompleteBehavior;
  onComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskStatusPress: (task: TaskWithCategory) => void;
  onTaskOpen: (task: TaskWithCategory) => void;
  onToggleNow: (task: TaskWithCategory) => void;
  registerExit: RegisterRowExit;
}

interface DayItem {
  date: string;
  tasks: TaskWithCategory[];
}

// SPEC.md §5.2, reworked: one week on one screen. A strip of the seven days
// (so the shape of the week reads at a glance — which days carry work) sits
// above the week's agenda, and the agenda lists only the days that have
// something in them. The earlier version was a list of week ranges that each
// opened a seven-block agenda full of "No tasks" lines — a lot of tapping to
// learn that a week was mostly empty.
export function WeekView({
  anchorDate,
  onNavigate,
  onSelectDate,
  completeBehavior,
  onComplete,
  onDelete,
  onLongPress,
  onTaskStatusPress,
  onTaskOpen,
  onToggleNow,
  registerExit,
}: Props) {
  const days = useMemo(() => weekDays(anchorDate), [anchorDate]);
  const rangeTasks = useTasksInRange(days[0], days[days.length - 1]);

  const items: DayItem[] = useMemo(
    () => days.map((date) => ({ date, tasks: rangeTasks.filter((t) => t.dueDate === date) })),
    [days, rangeTasks],
  );
  const busyDays = items.filter((item) => item.tasks.length > 0);
  const today = todayString();

  return (
    <View style={styles.flex}>
      <DateNavHeader
        label={formatWeekRangeLabel(anchorDate)}
        unit="week"
        onPrev={() => onNavigate(addDays(anchorDate, -7))}
        onNext={() => onNavigate(addDays(anchorDate, 7))}
      />

      <View style={styles.strip}>
        {items.map((item) => (
          <DayCell
            key={item.date}
            date={item.date}
            count={item.tasks.length}
            isToday={item.date === today}
            onPress={() => onSelectDate(parseDateString(item.date))}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {busyDays.length === 0 ? (
          <EmptyState message="Nothing planned this week." />
        ) : (
          busyDays.map((item) => (
            <View key={item.date}>
              <Text
                style={[styles.dayHeader, item.date === today && styles.dayHeaderToday]}
                accessibilityRole="header">
                {dayLabel(item.date, item.date === today)}
              </Text>
              {item.tasks.map((task) => (
                <SwipeableTaskRow
                  key={task.id}
                  task={task}
                  completeBehavior={completeBehavior}
                  onStatusPress={() => onTaskStatusPress(task)}
                  onOpen={() => onTaskOpen(task)}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onLongPress={onLongPress}
                  onToggleNow={onToggleNow}
                  registerExit={registerExit}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function dayLabel(date: string, isToday: boolean): string {
  const parsed = parseDateString(date);
  return `${weekdayAbbr(parsed)} · ${format(parsed, 'MMM d')}${isToday ? ' · Today' : ''}`;
}

interface DayCellProps {
  date: string;
  count: number;
  isToday: boolean;
  onPress: () => void;
}

// A weekday letter pair, the date in mono, and a dot when the day has tasks.
// Today wears the lime ring the Month grid uses, so "today" looks the same
// at every zoom level.
function DayCell({ date, count, isToday, onPress }: DayCellProps) {
  const parsed = parseDateString(date);
  const label = [
    format(parsed, 'EEEE, MMMM d'),
    isToday ? 'today' : null,
    count === 0 ? 'no tasks' : count === 1 ? '1 task' : `${count} tasks`,
    'opens the day',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable onPress={onPress} style={styles.cell} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.cellWeekday}>{weekdayAbbr(parsed)}</Text>
      <View style={[styles.cellCircle, isToday && styles.cellCircleToday]}>
        <Text style={[styles.cellNumber, isToday && styles.cellNumberToday]}>{parsed.getDate()}</Text>
      </View>
      <View style={[styles.dot, count > 0 && styles.dotVisible]} />
    </Pressable>
  );
}

const CIRCLE_SIZE = 36;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cell: {
    flex: 1,
    minHeight: minTouchTarget + spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  cellWeekday: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  cellCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellCircleToday: {
    borderWidth: 2,
    borderColor: colors.accentPrimary,
  },
  cellNumber: {
    fontFamily: fonts.mono,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  cellNumberToday: {
    color: colors.accentPrimary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.textSecondary,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  dayHeader: {
    fontFamily: fonts.heading,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dayHeaderToday: {
    color: colors.accentPrimary,
  },
});
