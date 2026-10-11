import { addDays, format } from 'date-fns';
import { ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AddTaskButton } from '@/components/AddTaskButton';
import { DateNavHeader } from './DateNavHeader';
import { DataText } from '@/components/DataText';
import { EmptyState } from '@/components/EmptyState';
import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import { useNextTaskAfter, useTasksInRange } from '@/hooks/useTasks';
import { formatDateLabel, parseDateString, toDateString } from '@/lib/dates';
import type { CompleteBehavior, RegisterRowExit, RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, iconSize, minTouchTarget, radius, spacing, strokeWidth } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  anchorDate: Date;
  onNavigate: (date: Date) => void;
  completeBehavior: CompleteBehavior;
  onComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskStatusPress: (task: TaskWithCategory) => void;
  onTaskOpen: (task: TaskWithCategory) => void;
  onAddTask: () => void;
  registerExit: RegisterRowExit;
}

// SPEC.md §5.1 — vertical agenda for a single day, same row style as Tasks tab.
// Also the Calendar tab's Add Task entry point (SPEC.md §3 requires one
// reachable from both tabs). Always rendered with completeBehavior='toggle'
// (calendar.tsx) — Calendar keeps showing done tasks, struck through.
export function DayView({
  anchorDate,
  onNavigate,
  completeBehavior,
  onComplete,
  onDelete,
  onLongPress,
  onTaskStatusPress,
  onTaskOpen,
  onAddTask,
  registerExit,
}: Props) {
  const dateStr = toDateString(anchorDate);
  const dayTasks = useTasksInRange(dateStr, dateStr);

  return (
    <View style={styles.flex}>
      <DateNavHeader
        label={format(anchorDate, 'EEEE, MMM d')}
        unit="day"
        onPrev={() => onNavigate(addDays(anchorDate, -1))}
        onNext={() => onNavigate(addDays(anchorDate, 1))}
      />
      <FlatList
        data={dayTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SwipeableTaskRow
            task={item}
            completeBehavior={completeBehavior}
            onStatusPress={() => onTaskStatusPress(item)}
            onOpen={() => onTaskOpen(item)}
            onComplete={onComplete}
            onDelete={onDelete}
            onLongPress={onLongPress}
            registerExit={registerExit}
          />
        )}
        ListEmptyComponent={<EmptyDay date={dateStr} onJump={onNavigate} />}
        ListFooterComponent={<AddTaskButton onPress={onAddTask} />}
      />
    </View>
  );
}

// The Calendar tab opens on today's Day view, so an empty day is often the
// tab's first impression. It used to stop at "No tasks for this day."; it
// now also says where the next piece of work is and jumps there in one tap.
function EmptyDay({ date, onJump }: { date: string; onJump: (date: Date) => void }) {
  const next = useNextTaskAfter(date);
  return (
    <View>
      <EmptyState message="Nothing due this day." />
      {next && (
        <Pressable
          onPress={() => onJump(parseDateString(next.dueDate))}
          style={styles.nextUp}
          accessibilityRole="button"
          accessibilityLabel={`Next up: ${next.title}, ${formatDateLabel(next.dueDate)}. Go to that day.`}
          android_ripple={{ color: colors.borderSubtle }}>
          <View style={styles.nextUpText}>
            <Text style={styles.nextUpLabel}>Next up</Text>
            <Text style={styles.nextUpTitle} numberOfLines={1}>
              {next.title}
            </Text>
          </View>
          <DataText style={styles.nextUpDate}>{formatDateLabel(next.dueDate)}</DataText>
          <ChevronRight size={iconSize.nav - 2} color={colors.textSecondary} strokeWidth={strokeWidth} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1 },
  nextUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget + spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
  },
  nextUpText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  nextUpLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.accentPrimary,
  },
  nextUpTitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  nextUpDate: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
