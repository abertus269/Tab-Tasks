import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskContextMenu } from '@/components/TaskContextMenu';
import { UndoToast } from '@/components/UndoToast';
import { DayView } from '@/components/calendar/DayView';
import { type CalendarMode, SegmentedControl } from '@/components/calendar/SegmentedControl';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { YearListView } from '@/components/calendar/YearListView';
import { useTaskRowActions } from '@/hooks/useTaskRowActions';
import { toDateString } from '@/lib/dates';
import { colors } from '@/theme/tokens';

// SPEC.md §5 — one dataset, four ways to look at it. All four views share a
// single anchorDate so switching modes preserves context: Day keeps prev/next
// arrows, while Week/Month/Year are continuous scrolls (no pagination) that
// each open already scrolled to anchorDate. This is local state rather than
// a global store because expo-router keeps tab screens mounted across tab
// switches, so it already persists for free without extra machinery.
export default function CalendarScreen() {
  const [mode, setMode] = useState<CalendarMode>('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const rowActions = useTaskRowActions();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SegmentedControl mode={mode} onChange={setMode} />

      {mode === 'day' && (
        <DayView
          anchorDate={anchorDate}
          onNavigate={setAnchorDate}
          onSwipeComplete={rowActions.swipeComplete}
          onDelete={rowActions.deleteWithUndo}
          onLongPress={rowActions.openMenu}
          onTaskPress={rowActions.cycleStatus}
          onAddTask={() => rowActions.openNewTask(toDateString(anchorDate))}
          registerExit={rowActions.registerRowExit}
        />
      )}
      {mode === 'week' && (
        <WeekView
          anchorDate={anchorDate}
          onNavigate={setAnchorDate}
          onSwipeComplete={rowActions.swipeComplete}
          onDelete={rowActions.deleteWithUndo}
          onLongPress={rowActions.openMenu}
          onTaskPress={rowActions.cycleStatus}
          registerExit={rowActions.registerRowExit}
        />
      )}
      {mode === 'month' && (
        <MonthView
          anchorDate={anchorDate}
          onSelectDate={(date) => {
            setAnchorDate(date);
            setMode('day');
          }}
        />
      )}
      {mode === 'year' && (
        <YearListView
          onSelectYear={(year) => {
            setAnchorDate(new Date(Number(year), 0, 1));
            setMode('month');
          }}
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
});
