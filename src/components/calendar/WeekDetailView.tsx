import { ChevronLeft } from 'lucide-react-native';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import { useTasksInRange } from '@/hooks/useTasks';
import { formatWeekRangeLabel, parseDateString, todayString, weekDays, weekdayAbbr } from '@/lib/dates';
import type { CompleteBehavior, RegisterRowExit, RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  weekStart: Date;
  onBack: () => void;
  completeBehavior: CompleteBehavior;
  onComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskStatusPress: (task: TaskWithCategory) => void;
  onTaskOpen: (task: TaskWithCategory) => void;
  registerExit: RegisterRowExit;
}

interface DayItem {
  date: string;
  tasks: TaskWithCategory[];
}

// The 7-day day-stacked agenda a WeekListView row opens into — the same
// rendering the old continuous-scroll WeekView used, just bounded to exactly
// weekDays(weekStart) instead of ~3 months. A fixed 7-item list needs none
// of FlatList's scroll-to-index machinery, so it's dropped entirely here —
// one less source of "landed on the wrong day" quirks.
export function WeekDetailView({
  weekStart,
  onBack,
  completeBehavior,
  onComplete,
  onDelete,
  onLongPress,
  onTaskStatusPress,
  onTaskOpen,
  registerExit,
}: Props) {
  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const rangeTasks = useTasksInRange(days[0], days[days.length - 1]);

  const items: DayItem[] = useMemo(
    () => days.map((date) => ({ date, tasks: rangeTasks.filter((t) => t.dueDate === date) })),
    [days, rangeTasks],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} label="Back to weeks" onPress={onBack} />
        <Text style={styles.headerLabel} numberOfLines={1} accessibilityRole="header">
          {formatWeekRangeLabel(weekStart)}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <DayBlock
            key={item.date}
            item={item}
            completeBehavior={completeBehavior}
            onComplete={onComplete}
            onDelete={onDelete}
            onLongPress={onLongPress}
            onTaskStatusPress={onTaskStatusPress}
            onTaskOpen={onTaskOpen}
            registerExit={registerExit}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface DayBlockProps {
  item: DayItem;
  completeBehavior: CompleteBehavior;
  onComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskStatusPress: (task: TaskWithCategory) => void;
  onTaskOpen: (task: TaskWithCategory) => void;
  registerExit: RegisterRowExit;
}

function DayBlock({ item, completeBehavior, onComplete, onDelete, onLongPress, onTaskStatusPress, onTaskOpen, registerExit }: DayBlockProps) {
  const date = parseDateString(item.date);
  const isToday = item.date === todayString();
  const label = `${weekdayAbbr(date)} · ${format(date, 'MMM d')}${isToday ? ' · Today' : ''}`;

  return (
    <View>
      <Text style={[styles.dayHeader, isToday && styles.dayHeaderToday]} accessibilityRole="header">
        {label}
      </Text>
      {item.tasks.length === 0 ? (
        <Text style={styles.emptyDay}>No tasks</Text>
      ) : (
        item.tasks.map((task) => (
          <SwipeableTaskRow
            key={task.id}
            task={task}
            completeBehavior={completeBehavior}
            onStatusPress={() => onTaskStatusPress(task)}
            onOpen={() => onTaskOpen(task)}
            onComplete={onComplete}
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
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  headerLabel: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
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
