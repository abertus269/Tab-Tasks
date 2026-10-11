import { isSameDay } from 'date-fns';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

// SPEC.md §5 — one dataset, four ways to look at it. All four views share a
// single anchorDate so switching modes preserves context: Day keeps prev/next
// arrows, while Week/Month/Year are continuous scrolls (no pagination) that
// each open already scrolled to anchorDate. This is local state rather than
// a global store because expo-router keeps tab screens mounted across tab
// switches, so it already persists for free without extra machinery.
export default function CalendarScreen() {
  const [mode, setMode] = useState<CalendarMode>('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const rowActions = useTaskRowActions({ completeBehavior: 'toggle' });
  // Week/Month/Year are long scrolls that only position themselves on
  // mount, so jumping to today remounts the active view (keyed on this).
  const [jumpKey, setJumpKey] = useState(0);

  // Day view on today already *is* today; everywhere else the scroll may
  // have wandered, so the way back is always offered.
  const showToday = mode !== 'day' || !isSameDay(anchorDate, new Date());

  function jumpToToday() {
    setAnchorDate(new Date());
    setJumpKey((k) => k + 1);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          Calendar
        </Text>
        {showToday && (
          <Pressable
            onPress={jumpToToday}
            style={styles.todayButton}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Jump to today">
            <Text style={styles.todayLabel}>Today</Text>
          </Pressable>
        )}
      </View>
      <SegmentedControl mode={mode} onChange={setMode} />

      {mode === 'day' && (
        <DayView
          key={jumpKey}
          anchorDate={anchorDate}
          onNavigate={setAnchorDate}
          completeBehavior={rowActions.completeBehavior}
          onComplete={rowActions.completeTask}
          onDelete={rowActions.deleteWithUndo}
          onLongPress={rowActions.openMenu}
          onTaskStatusPress={rowActions.cycleStatus}
          onTaskOpen={rowActions.editTask}
          onAddTask={() => rowActions.openNewTask(toDateString(anchorDate))}
          registerExit={rowActions.registerRowExit}
        />
      )}
      {mode === 'week' && (
        <WeekView
          key={jumpKey}
          anchorDate={anchorDate}
          onNavigate={setAnchorDate}
          completeBehavior={rowActions.completeBehavior}
          onComplete={rowActions.completeTask}
          onDelete={rowActions.deleteWithUndo}
          onLongPress={rowActions.openMenu}
          onTaskStatusPress={rowActions.cycleStatus}
          onTaskOpen={rowActions.editTask}
          registerExit={rowActions.registerRowExit}
        />
      )}
      {mode === 'month' && (
        <MonthView
          key={jumpKey}
          anchorDate={anchorDate}
          onSelectDate={(date) => {
            setAnchorDate(date);
            setMode('day');
          }}
        />
      )}
      {mode === 'year' && (
        <YearListView
          key={jumpKey}
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
    minHeight: minTouchTarget + spacing.sm,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.display,
    color: colors.textPrimary,
  },
  todayButton: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
  },
  todayLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.accentPrimary,
  },
});
