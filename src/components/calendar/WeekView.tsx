import { format } from 'date-fns';
import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import { useTasksInRange } from '@/hooks/useTasks';
import { continuousDayRange, parseDateString, toDateString, todayString, weekdayAbbr } from '@/lib/dates';
import type { RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  anchorDate: Date;
  onToggleComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskPress: (task: TaskWithCategory) => void;
  registerExit: (taskId: string, trigger: (direction: 1 | -1) => void) => () => void;
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
export function WeekView({ anchorDate, onToggleComplete, onDelete, onLongPress, onTaskPress, registerExit }: Props) {
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
        <DayBlock
          item={item}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onLongPress={onLongPress}
          onTaskPress={onTaskPress}
          registerExit={registerExit}
        />
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
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskPress: (task: TaskWithCategory) => void;
  registerExit: (taskId: string, trigger: (direction: 1 | -1) => void) => () => void;
}

function DayBlock({ item, onToggleComplete, onDelete, onLongPress, onTaskPress, registerExit }: DayBlockProps) {
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
          <SwipeableTaskRow
            key={task.id}
            task={task}
            onToggleComplete={() => onToggleComplete(task)}
            onPress={() => onTaskPress(task)}
            onDelete={onDelete}
            onLongPress={onLongPress}
            registerExit={registerExit}
          />
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
  emptyDay: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    paddingBottom: spacing.sm,
  },
});
