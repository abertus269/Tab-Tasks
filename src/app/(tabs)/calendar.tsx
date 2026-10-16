import { isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskContextMenu } from '@/components/TaskContextMenu';
import { UndoToast } from '@/components/UndoToast';
import { DayView } from '@/components/calendar/DayView';
import { type CalendarMode, SegmentedControl } from '@/components/calendar/SegmentedControl';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { YearView } from '@/components/calendar/YearView';
import { useTaskRowActions } from '@/hooks/useTaskRowActions';
import { toDateString } from '@/lib/dates';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

// SPEC.md §5 — one dataset, four ways to look at it. All four views share a
// single anchorDate so switching modes preserves context: Day, Week and Year
// step with prev/next arrows (a day, a week, a year), while Month is a
// continuous scroll that opens already scrolled to anchorDate. Picking a day
// in Week, a date in Month or a month in Year hands that date back here and
// drops into the next-finer view. This is local state rather than a global
// store because expo-router keeps tab screens mounted across tab switches, so
// it already persists for free without extra machinery.
export default function CalendarScreen() {
  const [mode, setMode] = useState<CalendarMode>('day');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const rowActions = useTaskRowActions({ completeBehavior: 'toggle' });
  // Month is a long scroll that only positions itself on mount, so jumping to
  // today remounts the active view (keyed on this).
  const [jumpKey, setJumpKey] = useState(0);

  // The way back to today is offered whenever the view isn't already showing
  // it — judged at the view's own grain: a day, a week, a month or a year.
  const now = new Date();
  const atToday =
    mode === 'day'
      ? isSameDay(anchorDate, now)
      : mode === 'week'
        ? isSameWeek(anchorDate, now)
        : mode === 'month'
          ? isSameMonth(anchorDate, now)
          : isSameYear(anchorDate, now);
  const showToday = !atToday;

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
          onToggleNow={rowActions.toggleNow}
          onAddTask={() => rowActions.openNewTask(toDateString(anchorDate))}
          registerExit={rowActions.registerRowExit}
        />
      )}
      {mode === 'week' && (
        <WeekView
          key={jumpKey}
          anchorDate={anchorDate}
          onNavigate={setAnchorDate}
          onSelectDate={(date) => {
            setAnchorDate(date);
            setMode('day');
          }}
          completeBehavior={rowActions.completeBehavior}
          onComplete={rowActions.completeTask}
          onDelete={rowActions.deleteWithUndo}
          onLongPress={rowActions.openMenu}
          onTaskStatusPress={rowActions.cycleStatus}
          onTaskOpen={rowActions.editTask}
          onToggleNow={rowActions.toggleNow}
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
        <YearView
          key={jumpKey}
          anchorDate={anchorDate}
          onNavigate={setAnchorDate}
          onSelectMonth={(monthStart) => {
            setAnchorDate(monthStart);
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
        onToggleNow={rowActions.confirmMenuToggleNow}
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
