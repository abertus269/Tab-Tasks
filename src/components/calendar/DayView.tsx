import { addDays, format } from 'date-fns';
import { FlatList, StyleSheet, View } from 'react-native';

import { AddTaskButton } from '@/components/AddTaskButton';
import { DateNavHeader } from './DateNavHeader';
import { EmptyState } from '@/components/EmptyState';
import { TaskRow } from '@/components/TaskRow';
import { useTasksInRange } from '@/hooks/useTasks';
import { toDateString } from '@/lib/dates';
import type { TaskWithCategory } from '@/lib/types';
import { spacing } from '@/theme/tokens';

interface Props {
  anchorDate: Date;
  onNavigate: (date: Date) => void;
  onToggleComplete: (task: TaskWithCategory) => void;
  onOpenMenu: (task: TaskWithCategory) => void;
  onTaskPress: (task: TaskWithCategory) => void;
  onAddTask: () => void;
}

// SPEC.md §5.1 — vertical agenda for a single day, same row style as Tasks tab.
// Also the Calendar tab's Add Task entry point (SPEC.md §3 requires one
// reachable from both tabs).
export function DayView({ anchorDate, onNavigate, onToggleComplete, onOpenMenu, onTaskPress, onAddTask }: Props) {
  const dateStr = toDateString(anchorDate);
  const dayTasks = useTasksInRange(dateStr, dateStr);

  return (
    <View style={styles.flex}>
      <DateNavHeader
        label={format(anchorDate, 'EEEE, MMM d')}
        onPrev={() => onNavigate(addDays(anchorDate, -1))}
        onNext={() => onNavigate(addDays(anchorDate, 1))}
      />
      <FlatList
        data={dayTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onToggleComplete={() => onToggleComplete(item)}
            onPress={() => onTaskPress(item)}
            onOpenMenu={() => onOpenMenu(item)}
          />
        )}
        ListEmptyComponent={<EmptyState message="No tasks for this day." />}
        ListFooterComponent={<AddTaskButton onPress={onAddTask} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1 },
  separator: { height: spacing.sm },
});
