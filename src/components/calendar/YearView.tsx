import { addYears, format, isSameYear } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DateNavHeader } from './DateNavHeader';
import { DataText } from '@/components/DataText';
import { useTaskCountsInRange } from '@/hooks/useTasks';
import { monthTotalsForYear } from '@/lib/dates';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  anchorDate: Date;
  onNavigate: (date: Date) => void;
  // Tapping a month opens it in the Month view.
  onSelectMonth: (monthStart: Date) => void;
}

const COLUMNS = 3;

// SPEC.md §5.4, reworked: one year as twelve month tiles you can see all at
// once, each carrying how many tasks it holds — the way back to a specific
// month is one tap. The earlier version was a scroll of year numbers (2016 to
// 2036), nearly all of them empty, that took two taps to reach any month.
// A month with no tasks shows no count at all, so the busy months are the
// ones that stand out. The current month wears the lime ring Today wears at
// every other zoom level.
export function YearView({ anchorDate, onNavigate, onSelectMonth }: Props) {
  const { width } = useWindowDimensions();
  const year = anchorDate.getFullYear();
  const counts = useTaskCountsInRange(`${year}-01-01`, `${year}-12-31`);
  const totals = useMemo(() => monthTotalsForYear(counts, year), [counts, year]);

  const now = new Date();
  const currentMonth = isSameYear(now, anchorDate) ? now.getMonth() : -1;
  const tileWidth = (width - spacing.lg * 2 - spacing.sm * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.flex}>
      <DateNavHeader
        label={String(year)}
        unit="year"
        onPrev={() => onNavigate(addYears(anchorDate, -1))}
        onNext={() => onNavigate(addYears(anchorDate, 1))}
      />
      <ScrollView contentContainerStyle={styles.grid}>
        {totals.map((count, monthIndex) => {
          const monthStart = new Date(year, monthIndex, 1);
          return (
            <MonthTile
              key={monthIndex}
              monthStart={monthStart}
              count={count}
              isCurrent={monthIndex === currentMonth}
              width={tileWidth}
              onPress={() => onSelectMonth(monthStart)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

interface TileProps {
  monthStart: Date;
  count: number;
  isCurrent: boolean;
  width: number;
  onPress: () => void;
}

function MonthTile({ monthStart, count, isCurrent, width, onPress }: TileProps) {
  const tasksLabel = count === 0 ? 'no tasks' : count === 1 ? '1 task' : `${count} tasks`;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width }, isCurrent && styles.tileCurrent]}
      accessibilityRole="button"
      accessibilityLabel={`${format(monthStart, 'MMMM yyyy')}, ${tasksLabel}${isCurrent ? ', this month' : ''}. Opens the month.`}>
      <Text style={[styles.monthName, isCurrent && styles.monthNameCurrent]}>{format(monthStart, 'MMM')}</Text>
      {count > 0 && <DataText style={styles.count}>{`${count} ${count === 1 ? 'task' : 'tasks'}`}</DataText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  tile: {
    minHeight: minTouchTarget + spacing.xl + spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileCurrent: {
    borderColor: colors.accentPrimary,
  },
  monthName: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  monthNameCurrent: {
    color: colors.accentPrimary,
  },
  count: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
