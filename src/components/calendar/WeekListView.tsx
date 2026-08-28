import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { WeekRow } from '@/components/WeekRow';
import { useTaskCountsInRange } from '@/hooks/useTasks';
import { continuousWeekRange, formatWeekRangeLabel, sumTaskCounts, toDateString, todayString, weekDays } from '@/lib/dates';
import { spacing } from '@/theme/tokens';

interface Props {
  anchorDate: Date;
  onSelectWeek: (weekStart: Date) => void;
}

const WEEKS_BACK = 4;
const WEEKS_FORWARD = 12; // upcoming-biased, matching the day-agenda view's old MONTHS_BACK=1/FORWARD=2 window

// Week view, redesigned per user request: a scrollable list of week rows
// (date range + task count) instead of a continuous day-by-day agenda —
// mirrors YearListView's list-of-buckets pattern. Tapping a row hands the
// week's start Date to the caller (WeekView switches to WeekDetailView).
//
// Counts are fetched once for the whole scrollable range (MonthView's
// pattern, documented there) rather than one query per row — the exact
// same useTaskCountsInRange per-day map MonthView uses for its dots, summed
// per week client-side via weekDays()/sumTaskCounts(). No new SQL.
export function WeekListView({ anchorDate, onSelectWeek }: Props) {
  const listRef = useRef<FlatList<Date>>(null);

  const weeks = useMemo(() => continuousWeekRange(anchorDate, WEEKS_BACK, WEEKS_FORWARD), [anchorDate]);

  const overallRange = useMemo(() => {
    const firstDays = weekDays(weeks[0]);
    const lastDays = weekDays(weeks[weeks.length - 1]);
    return { start: firstDays[0], end: lastDays[6] };
  }, [weeks]);

  const dayCounts = useTaskCountsInRange(overallRange.start, overallRange.end);

  const weekCounts = useMemo(() => weeks.map((w) => sumTaskCounts(dayCounts, weekDays(w))), [weeks, dayCounts]);

  const today = todayString();
  const initialIndex = useMemo(() => {
    const idx = weeks.findIndex((w) => weekDays(w).includes(toDateString(anchorDate)));
    return idx === -1 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks]);

  return (
    <FlatList
      ref={listRef}
      data={weeks}
      keyExtractor={(w) => toDateString(w)}
      initialScrollIndex={initialIndex}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item, index }) => (
        <WeekRow
          rangeLabel={formatWeekRangeLabel(item)}
          taskCount={weekCounts[index]}
          isCurrentWeek={weekDays(item).includes(today)}
          onPress={() => onSelectWeek(item)}
        />
      )}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 50);
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  separator: { height: spacing.sm },
});
