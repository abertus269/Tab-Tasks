import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTaskButton } from '@/components/AddTaskButton';
import { EmptyState } from '@/components/EmptyState';
import { FilterPill } from '@/components/FilterPill';
import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import { TaskContextMenu } from '@/components/TaskContextMenu';
import { TodayDivider } from '@/components/TodayDivider';
import { UndoToast } from '@/components/UndoToast';
import { useCategories } from '@/hooks/useCategories';
import { useTaskRowActions } from '@/hooks/useTaskRowActions';
import { useAllTasks } from '@/hooks/useTasks';
import { todayString } from '@/lib/dates';
import { withTodayDivider } from '@/lib/ordering';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

type FilterValue = 'all' | 'uncategorized' | string;

interface FilterOption {
  id: FilterValue;
  name: string;
  color?: string;
  icon?: string | null;
}

export default function TasksScreen() {
  const allTasks = useAllTasks();
  const categories = useCategories();
  const rowActions = useTaskRowActions();
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  const filterOptions: FilterOption[] = useMemo(
    () => [
      { id: 'all', name: 'All' },
      ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon })),
      { id: 'uncategorized', name: 'Uncategorized' },
    ],
    [categories],
  );

  // The filter row narrows what's *rendered* only — it never re-sorts or
  // re-groups the underlying merged list (SPEC.md §4).
  const visibleTasks = useMemo(() => {
    if (activeFilter === 'all') return allTasks;
    if (activeFilter === 'uncategorized') return allTasks.filter((t) => t.categoryId === null);
    return allTasks.filter((t) => t.categoryId === activeFilter);
  }, [allTasks, activeFilter]);

  const rows = useMemo(() => withTodayDivider(visibleTasks, todayString()), [visibleTasks]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Tasks</Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterOptions}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.filterRow}
        style={styles.filterList}
        renderItem={({ item }) => (
          <FilterPill
            label={item.name}
            color={item.color}
            icon={item.icon}
            selected={activeFilter === item.id}
            onPress={() => setActiveFilter(item.id)}
          />
        )}
      />

      {visibleTasks.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState message={activeFilter === 'all' ? 'No tasks yet.' : 'No tasks in this category.'} />
          <AddTaskButton onPress={() => rowActions.openNewTask()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => (row.type === 'divider' ? 'divider' : row.task.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            item.type === 'divider' ? (
              <TodayDivider />
            ) : (
              <SwipeableTaskRow
                task={item.task}
                onToggleComplete={() => rowActions.toggleComplete(item.task)}
                onPress={() => rowActions.editTask(item.task)}
                onDelete={rowActions.deleteWithUndo}
                onLongPress={rowActions.openMenu}
                registerExit={rowActions.registerRowExit}
              />
            )
          }
          ListFooterComponent={<AddTaskButton onPress={() => rowActions.openNewTask()} />}
        />
      )}

      <TaskContextMenu
        task={rowActions.menu?.task ?? null}
        anchor={rowActions.menu?.anchor ?? null}
        onClose={rowActions.closeMenu}
        onEdit={() => rowActions.menu && rowActions.editTask(rowActions.menu.task)}
        onDelete={rowActions.confirmMenuDelete}
      />

      <UndoToast visible={!!rowActions.pendingUndo} onUndo={rowActions.undoDelete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.display,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterList: {
    flexGrow: 0,
  },
  filterRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
    flexGrow: 1,
    gap: spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
