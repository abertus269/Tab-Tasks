import { format } from 'date-fns';
import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { TaskRow } from '@/components/TaskRow';
import { useTasksInRange } from '@/hooks/useTasks';
import { continuousDayRange, parseDateString, toDateString, todayString, weekdayAbbr } from '@/lib/dates';
import type { TaskWithCategory } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  anchorDate: Date;
  onToggleComplete: (task: TaskWithCategory) => void;
  onOpenMenu: (task: TaskWithCategory) => void;
  onTaskPress: (task: TaskWithCategory) => void;
}

interface DayItem {
  date: string;
  tasks: TaskWithCategory[];
}

const MONTHS_BACK = 1;
const MONTHS_FORWARD = 2; // >= 3 months of continuous scroll, biased toward upcoming

// SPEC.md §5.2, extended per user request: a continuously scrollable agenda —
// no prev/next pagination — spanning several months, each day a labeled
// section stacked one after another. Opens scrolled to `anchorDate`.
export function WeekView({ anchorDate, onToggleComplete, onOpenMenu, onTaskPress }: Props) {
  const listRef = useRef<FlatList<DayItem>>(null);

  const allDays = useMemo(() => continuousDayRange(anchorDate, MONTHS_BACK, MONTHS_FORWARD), [anchorDate]);
  const rangeTasks = useTasksInRange(allDays[0], allDays[allDays.length - 1]);

  const items: DayItem[] = useMemo(
    () => allDays.map((date) => ({ date, tasks: rangeTasks.filter((t) => t.dueDate === date) })),
    [allDays, rangeTasks],
  );

  const initialIndex = useMemo(() => {
    const idx = allDays.indexOf(toDateString(anchorDate));
    return idx === -1 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDays]);

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(item) => item.date}
      initialScrollIndex={initialIndex}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <DayBlock item={item} onToggleComplete={onToggleComplete} onOpenMenu={onOpenMenu} onTaskPress={onTaskPress} />
      )}
      onScrollToIndexFailed={(info) => {
        // Row heights vary with task count, so the layout estimate that backs
        // initialScrollIndex can miss before everything above it has been
        // measured — retry once layout settles.
        setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 50);
      }}
    />
  );
}

interface DayBlockProps {
  item: DayItem;
  onToggleComplete: (task: TaskWithCategory) => void;
  onOpenMenu: (task: TaskWithCategory) => void;
  onTaskPress: (task: TaskWithCategory) => void;
}

function DayBlock({ item, onToggleComplete, onOpenMenu, onTaskPress }: DayBlockProps) {
  const date = parseDateString(item.date);
  const isToday = item.date === todayString();
  const label = `${weekdayAbbr(date)} · ${format(date, 'MMM d')}${isToday ? ' · Today' : ''}`;

  return (
    <View>
      <Text style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>{label}</Text>
      {item.tasks.length === 0 ? (
        <Text style={styles.emptyDay}>No tasks</Text>
      ) : (
        item.tasks.map((task) => (
          <View key={task.id} style={styles.rowWrap}>
            <TaskRow
              task={task}
              onToggleComplete={() => onToggleComplete(task)}
              onPress={() => onTaskPress(task)}
              onOpenMenu={() => onOpenMenu(task)}
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
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
  rowWrap: {
    paddingBottom: spacing.sm,
  },
  emptyDay: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    paddingBottom: spacing.sm,
  },
});
