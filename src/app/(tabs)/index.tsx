import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTaskButton } from '@/components/AddTaskButton';
import { EmptyState } from '@/components/EmptyState';
import { EmptyTodayRow, ListDivider } from '@/components/ListDivider';
import { FilterPill } from '@/components/FilterPill';
import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import { TaskContextMenu } from '@/components/TaskContextMenu';
import { UndoToast } from '@/components/UndoToast';
import { useCategories } from '@/hooks/useCategories';
import { useTaskRowActions } from '@/hooks/useTaskRowActions';
import { useAllTasks } from '@/hooks/useTasks';
import { todayString } from '@/lib/dates';
import { COMPLETED_FILTER, emptyMessageFor, filterTasks, inCategoryScope, type FilterValue } from '@/lib/filters';
import { type RenderRow, withListDividers } from '@/lib/ordering';
import type { TaskWithCategory } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface FilterOption {
  id: FilterValue;
  name: string;
  color?: string;
  icon?: string | null;
}

export default function TasksScreen() {
  const router = useRouter();
  const allTasks = useAllTasks();
  const categories = useCategories();
  const rowActions = useTaskRowActions({ completeBehavior: 'exit' });
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  const filterOptions: FilterOption[] = useMemo(
    () => [
      { id: 'all', name: 'All' },
      ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon })),
      { id: 'uncategorized', name: 'Uncategorized' },
      { id: COMPLETED_FILTER, name: 'Completed', icon: 'circle-check' },
    ],
    [categories],
  );

  // The filter row narrows what's *rendered* only — it never re-sorts or
  // re-groups the underlying merged list (SPEC.md §4). Done tasks are
  // excluded from every filter except 'completed', which shows only them
  // (src/lib/filters.ts) — that's what makes a completed swipe/tap leave
  // whichever view it was in.
  const visibleTasks = useMemo(() => filterTasks(allTasks, activeFilter), [allTasks, activeFilter]);

  // A done list has no "due" structure, so the Completed view skips the
  // Today/Upcoming dividers entirely — everywhere else keeps them.
  const rows: RenderRow<TaskWithCategory>[] = useMemo(() => {
    if (activeFilter === COMPLETED_FILTER) {
      return visibleTasks.map((task) => ({ type: 'task', task }));
    }
    return withListDividers(visibleTasks, todayString());
  }, [visibleTasks, activeFilter]);

  const hasAnyInScope = useMemo(
    () => allTasks.some((t) => inCategoryScope(t, activeFilter)),
    [allTasks, activeFilter],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Tasks</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Settings size={22} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
      </View>

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
          <EmptyState message={emptyMessageFor(activeFilter, hasAnyInScope)} />
          <AddTaskButton onPress={() => rowActions.openNewTask()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => {
            if (row.type === 'divider') return `divider-${row.kind}`;
            if (row.type === 'emptyToday') return 'empty-today';
            return row.task.id;
          }}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.type === 'divider') return <ListDivider kind={item.kind} />;
            if (item.type === 'emptyToday') return <EmptyTodayRow />;
            return (
              <SwipeableTaskRow
                task={item.task}
                completeBehavior={rowActions.completeBehavior}
                onPress={() => rowActions.cycleStatus(item.task)}
                onComplete={rowActions.completeTask}
                onDelete={rowActions.deleteWithUndo}
                onLongPress={rowActions.openMenu}
                registerExit={rowActions.registerRowExit}
              />
            );
          }}
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

      <UndoToast visible={!!rowActions.pendingUndo} message={rowActions.undoMessage} onUndo={rowActions.undo} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.display,
    color: colors.textPrimary,
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
