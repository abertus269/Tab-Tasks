import { format } from 'date-fns';
import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { MonthGrid } from '@/components/MonthGrid';
import { useTaskCountsInRange } from '@/hooks/useTasks';
import {
  continuousMonthRange,
  monthGrid,
  monthGridRange,
  parseDateString,
  toDateString,
  todayString,
  WEEKDAY_ABBR,
} from '@/lib/dates';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  anchorDate: Date;
  onSelectDate: (date: Date) => void;
}

const MONTHS_BACK = 12;
const MONTHS_FORWARD = 12;

// SPEC.md §5.3, extended per user request: a continuously scrollable series
// of month grids — no prev/next pagination, one persistent weekday header.
// Tapping a date jumps into Day view for it (handled by the caller via
// onSelectDate).
//
// Task counts for the *entire* scrollable range are fetched once here rather
// than per month grid — a query per mounted grid meant every month that
// scrolled into view had to wait on a fresh DB round-trip before it could
// render its dots, which is what made fast scrolling look like it was
// loading/blanking out. One query + a plain lookup makes each grid free to
// mount.
export function MonthView({ anchorDate, onSelectDate }: Props) {
  const listRef = useRef<FlatList<Date>>(null);

  const months = useMemo(() => continuousMonthRange(anchorDate, MONTHS_BACK, MONTHS_FORWARD), [anchorDate]);

  const overallRange = useMemo(() => {
    const first = monthGridRange(months[0]);
    const last = monthGridRange(months[months.length - 1]);
    return { start: first.start, end: last.end };
  }, [months]);

  const counts = useTaskCountsInRange(overallRange.start, overallRange.end);

  const initialIndex = useMemo(() => {
    const anchorMonthStr = format(anchorDate, 'yyyy-MM');
    const idx = months.findIndex((m) => format(m, 'yyyy-MM') === anchorMonthStr);
    return idx === -1 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  const selectedDate = toDateString(anchorDate);
  const today = todayString();

  return (
    <View style={styles.flex}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_ABBR.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <FlatList
        ref={listRef}
        data={months}
        keyExtractor={(m) => format(m, 'yyyy-MM')}
        initialScrollIndex={initialIndex}
        initialNumToRender={5}
        windowSize={7}
        maxToRenderPerBatch={5}
        contentContainerStyle={styles.list}
        renderItem={({ item: monthStart }) => (
          <MonthBlock
            monthStart={monthStart}
            selectedDate={selectedDate}
            today={today}
            counts={counts}
            onSelectDate={onSelectDate}
          />
        )}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 50);
        }}
      />
    </View>
  );
}

interface MonthBlockProps {
  monthStart: Date;
  selectedDate: string;
  today: string;
  counts: Record<string, number>;
  onSelectDate: (date: Date) => void;
}

// Pure/presentational — no hooks, no DB access, so mounting one as it
// scrolls into view is just laying out views, not waiting on a query.
function MonthBlock({ monthStart, selectedDate, today, counts, onSelectDate }: MonthBlockProps) {
  const grid = monthGrid(monthStart);

  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthLabel}>{format(monthStart, 'MMMM yyyy')}</Text>
      <MonthGrid
        grid={grid}
        currentMonthPrefix={format(monthStart, 'yyyy-MM')}
        selectedDate={selectedDate}
        todayDate={today}
        taskCounts={counts}
        showWeekdayHeader={false}
        onSelectDate={(date) => onSelectDate(parseDateString(date))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  monthBlock: { paddingTop: spacing.lg },
  monthLabel: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
    paddingBottom: spacing.sm,
  },
});
