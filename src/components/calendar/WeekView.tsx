import { useState } from 'react';

import { WeekDetailView } from './WeekDetailView';
import { WeekListView } from './WeekListView';
import type { RowAnchor, TaskWithCategory } from '@/lib/types';

interface Props {
  anchorDate: Date;
  onNavigate: (date: Date) => void;
  onSwipeComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onTaskPress: (task: TaskWithCategory) => void;
  registerExit: (taskId: string, trigger: (direction: 1 | -1) => void) => () => void;
}

// SPEC.md §5.2, redesigned per user request: a list of week rows (date range
// + task count, like Year's list of years) rather than a continuous
// day-by-day agenda. Tapping a row opens that week's 7-day agenda
// (WeekDetailView — the old continuous-scroll WeekView's rendering, just
// bounded to one week). List vs. detail is local state here rather than a
// new CalendarMode, mirroring how TaskFormScreen's create/edit split lives
// inside one route rather than two; expo-router keeps this tab mounted
// across tab switches, so leaving and returning to a week's detail is free.
export function WeekView({ anchorDate, onNavigate, onSwipeComplete, onDelete, onLongPress, onTaskPress, registerExit }: Props) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);

  if (selectedWeekStart) {
    return (
      <WeekDetailView
        weekStart={selectedWeekStart}
        onBack={() => setSelectedWeekStart(null)}
        onSwipeComplete={onSwipeComplete}
        onDelete={onDelete}
        onLongPress={onLongPress}
        onTaskPress={onTaskPress}
        registerExit={registerExit}
      />
    );
  }

  return (
    <WeekListView
      anchorDate={anchorDate}
      onSelectWeek={(weekStart) => {
        onNavigate(weekStart);
        setSelectedWeekStart(weekStart);
      }}
    />
  );
}
