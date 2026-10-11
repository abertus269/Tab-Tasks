import { Bell, Check } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { CategoryBadge } from '@/components/CategoryBadge';
import { DataText } from '@/components/DataText';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatDueDateShort, formatTime12h, todayString } from '@/lib/dates';
import type { TaskStatus } from '@/lib/status';
import type { TaskWithCategory } from '@/lib/types';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  task: TaskWithCategory;
  // The status square — cycles todo → active → done (src/lib/status.ts).
  onStatusPress?: () => void;
  // The rest of the row — opens the task in the edit form.
  onPress?: () => void;
  accessibilityActions?: AccessibilityActionInfo[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

const STATUS_SPOKEN: Record<TaskStatus, string> = {
  todo: 'to do',
  active: 'active',
  done: 'done',
};

// Two targets, one row. The status square is its own 48dp button, because
// something that looks like a checkbox should *be* the toggle. Tapping
// anywhere else opens the task. Before this split, a tap on the row
// itself changed the task's status, which caught out anyone who tapped
// to open a task. Swipe and long-press are layered on top by
// SwipeableTaskRow and don't interfere with either tap.
export function TaskRow({ task, onStatusPress, onPress, accessibilityActions, onAccessibilityAction }: Props) {
  // Always show the due date, not just the time — this list merges every
  // date together, and a row's position relative to the today-divider isn't
  // enough on its own to tell a future task from one due today.
  const dueLabel = task.dueTime
    ? `${formatDueDateShort(task.dueDate)} · ${formatTime12h(task.dueTime)}`
    : formatDueDateShort(task.dueDate);
  const hasReminder = task.reminderMinutesBefore !== null;
  const isDone = task.status === 'done';
  const isActive = task.status === 'active';
  const isOverdue = !isDone && task.dueDate < todayString();

  // A small press-in-and-spring on the square whenever the status actually
  // changes — the moment of ticking something off gets a beat of its own
  // instead of a silent color swap. Skipped on first mount, so rows don't
  // all pop as a list renders.
  const squareScale = useSharedValue(1);
  const previousStatus = useRef(task.status);
  useEffect(() => {
    if (previousStatus.current === task.status) return;
    previousStatus.current = task.status;
    squareScale.value = withSequence(
      withTiming(0.78, { duration: 80 }),
      withSpring(1, { damping: 9, stiffness: 320 }),
    );
  }, [task.status, squareScale]);
  const squareStyle = useAnimatedStyle(() => ({ transform: [{ scale: squareScale.value }] }));

  const rowLabel = [
    task.title,
    STATUS_SPOKEN[task.status],
    isOverdue ? 'overdue' : null,
    task.category?.name ?? 'Uncategorized',
    `due ${dueLabel.replace(' · ', ' at ')}`,
    hasReminder ? 'reminder set' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, isActive && styles.rowActive, pressed && styles.rowPressed]}
      android_ripple={{ color: colors.borderSubtle }}
      accessibilityRole="button"
      accessibilityLabel={rowLabel}
      accessibilityHint="Opens the task"
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}>
      <Pressable
        onPress={onStatusPress}
        disabled={!onStatusPress}
        style={styles.statusTarget}
        accessibilityRole="checkbox"
        accessibilityLabel={`Status, ${STATUS_SPOKEN[task.status]}`}
        accessibilityState={{ checked: isDone ? true : task.status === 'active' ? 'mixed' : false }}>
        <Animated.View
          style={[styles.checkbox, isActive && styles.checkboxActive, isDone && styles.checkboxChecked, squareStyle]}>
          {isDone && <Check size={14} color={colors.bgBase} strokeWidth={3} />}
          {isActive && <View style={styles.checkboxActiveDot} />}
        </Animated.View>
      </Pressable>

      {/* Reserved even when empty, so every title starts on the same line. */}
      <View style={styles.taskIcon}>
        {task.icon && <DynamicIcon name={task.icon} size={18} color={colors.textSecondary} strokeWidth={1.75} />}
      </View>

      <View style={styles.content} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.title, isDone && styles.titleCompleted]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          {isActive && (
            <>
              {/* Spelled out, not only tinted — the state can't rest on color alone. */}
              <Text style={styles.nowLabel}>Now</Text>
              <Text style={styles.metaDot}>·</Text>
            </>
          )}
          <CategoryBadge category={task.category} />
          <Text style={styles.metaDot}>·</Text>
          <DataText style={[styles.dueTime, isOverdue && styles.dueOverdue]}>{dueLabel}</DataText>
          {hasReminder && <Bell size={12} color={colors.textSecondary} strokeWidth={1.75} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    // The status target's 48dp box supplies the left inset (12dp around a
    // 24dp square), so the row itself only adds 4dp to land the square at 16.
    paddingLeft: spacing.xs,
    paddingRight: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    backgroundColor: colors.bgActive,
    borderColor: colors.borderActive,
  },
  rowPressed: {
    backgroundColor: colors.bgSurfaceRaised,
  },
  statusTarget: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.accentPrimary,
  },
  checkboxActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.accentPrimary,
  },
  checkboxChecked: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  taskIcon: {
    width: 18,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs / 2,
    paddingVertical: spacing.sm,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  titleCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDot: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: fontSize.caption,
  },
  dueTime: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  dueOverdue: {
    color: colors.accentWarm,
  },
  nowLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.accentPrimary,
  },
});
