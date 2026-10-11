import { format } from 'date-fns';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseDateString, WEEKDAY_ABBR } from '@/lib/dates';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  grid: string[][]; // 6x7 'YYYY-MM-DD' strings, from lib/dates.monthGrid
  currentMonthPrefix: string; // 'YYYY-MM' — cells outside this are dimmed
  selectedDate: string;
  todayDate: string;
  taskCounts: Record<string, number>;
  onSelectDate: (date: string) => void;
  showWeekdayHeader?: boolean;
}

// DESIGN.md §6 — standard 7-column calendar. Selected date: solid
// accent-primary filled circle behind the number. Dates with tasks get a
// small dot indicator.
export function MonthGrid({
  grid,
  currentMonthPrefix,
  selectedDate,
  todayDate,
  taskCounts,
  onSelectDate,
  showWeekdayHeader = true,
}: Props) {
  return (
    <View>
      {showWeekdayHeader && (
        // Each day cell already announces its full weekday; reading the
        // "Su M Tu…" strip as well would just be noise.
        <View style={styles.weekdayRow} importantForAccessibility="no-hide-descendants">
          {WEEKDAY_ABBR.map((label, i) => (
            <Text key={i} style={styles.weekdayLabel}>
              {label}
            </Text>
          ))}
        </View>
      )}
      {grid.map((week, i) => (
        <View key={i} style={styles.weekRow}>
          {week.map((date) => {
            const inMonth = date.startsWith(currentMonthPrefix);
            const isSelected = date === selectedDate;
            const isToday = date === todayDate;
            const count = taskCounts[date] ?? 0;
            const dayNumber = Number(date.slice(8, 10));

            return (
              <Pressable
                key={date}
                onPress={() => onSelectDate(date)}
                style={styles.cell}
                accessibilityRole="button"
                accessibilityLabel={dayCellLabel(date, count, isToday)}
                accessibilityState={{ selected: isSelected }}>
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                  ]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      !inMonth && styles.dayNumberOutOfMonth,
                      isSelected && styles.dayNumberSelected,
                      isToday && !isSelected && styles.dayNumberToday,
                    ]}>
                    {dayNumber}
                  </Text>
                </View>
                <View style={[styles.dot, count > 0 && (isSelected ? styles.dotSelected : styles.dotVisible)]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// "Sunday, October 11, today, 2 tasks" — a bare "11" tells a TalkBack user
// nothing about which month it's in or whether anything is due.
function dayCellLabel(date: string, count: number, isToday: boolean): string {
  const parts = [format(parseDateString(date), 'EEEE, MMMM d')];
  if (isToday) parts.push('today');
  parts.push(count === 0 ? 'no tasks' : count === 1 ? '1 task' : `${count} tasks`);
  return parts.join(', ');
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Today is a lime ring, so it holds its own next to the filled selected
  // circle instead of reading as lime text that a selection outshouts.
  dayCircleToday: {
    borderWidth: 2,
    borderColor: colors.accentPrimary,
  },
  dayCircleSelected: {
    backgroundColor: colors.accentPrimary,
  },
  dayNumber: {
    fontFamily: fonts.mono,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  dayNumberOutOfMonth: {
    color: colors.textMuted,
  },
  dayNumberSelected: {
    color: colors.bgBase,
  },
  dayNumberToday: {
    color: colors.accentPrimary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.accentWarm,
  },
  dotSelected: {
    backgroundColor: colors.accentPrimary,
  },
});
