import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEEKDAY_ABBR } from '@/lib/dates';
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
        <View style={styles.weekdayRow}>
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
              <Pressable key={date} onPress={() => onSelectDate(date)} style={styles.cell}>
                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
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

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono,
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
    gap: 3,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.accentPrimary,
  },
  dayNumber: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  dayNumberOutOfMonth: {
    color: colors.textMuted,
  },
  dayNumberSelected: {
    color: colors.bgBase,
    fontFamily: fonts.bodyMedium,
  },
  dayNumberToday: {
    color: colors.accentPrimary,
    fontFamily: fonts.bodyMedium,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.accentWarm,
  },
  dotSelected: {
    backgroundColor: colors.accentPrimary,
  },
});
