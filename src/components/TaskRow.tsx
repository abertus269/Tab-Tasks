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
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
  // 'card' is the row's own surface. 'embedded' is the same row laid flat
  // inside another surface (the Now card) — no fill, no border, no inline
  // "Now" label, since the card around it already says so. Cards never nest.
  variant?: 'card' | 'embedded';
  // The row is being finished right now: show the check before the row slides
  // out, so completing has a beat of its own (SwipeableTaskRow sets this).
  completing?: boolean;
  // The status square. By default it finishes the task; with the cycle
  // setting on it steps todo → active → done (src/lib/status.ts).
  onStatusPress?: () => void;
  // The rest of the row — opens the task in the edit form.
  onPress?: () => void;
  accessibilityActions?: AccessibilityActionInfo[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

const STATUS_SPOKEN: Record<TaskStatus, string> = {
  todo: 'to do',
  active: 'in progress',
  done: 'done',
};

// Two targets, one row. The status square is its own 48dp button, because
// something that looks like a checkbox should *be* the toggle. Tapping
// anywhere else opens the task. Before this split, a tap on the row
// itself changed the task's status, which caught out anyone who tapped
// to open a task. Swipe and long-press are layered on top by
// SwipeableTaskRow and don't interfere with either tap.
export function TaskRow({
  task,
  variant = 'card',
  completing = false,
  onStatusPress,
  onPress,
  accessibilityActions,
  onAccessibilityAction,
}: Props) {
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
  const isEmbedded = variant === 'embedded';
  // The square reads as done while the row is mid-finish, too.
  const showsDone = isDone || completing;

  // A small press-in-and-spring on the square whenever the status actually
  // changes (or the row starts finishing) — the moment of ticking something
  // off gets a beat of its own instead of a silent color swap. Skipped on
  // first mount, so rows don't all pop as a list renders, and skipped
  // entirely when the system asks for reduced motion.
  const reduceMotion = useReducedMotion();
  const squareScale = useSharedValue(1);
  const previousLook = useRef(`${task.status}:${completing}`);
  useEffect(() => {
    const look = `${task.status}:${completing}`;
    if (previousLook.current === look) return;
    previousLook.current = look;
    if (reduceMotion) return;
    squareScale.value = withSequence(
      withTiming(0.78, { duration: 80 }),
      withSpring(1, { damping: 9, stiffness: 320 }),
    );
  }, [task.status, completing, reduceMotion, squareScale]);
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
      style={({ pressed }) => [
        styles.row,
        isActive && !isEmbedded && styles.rowActive,
        isEmbedded && styles.rowEmbedded,
        pressed && !isEmbedded && styles.rowPressed,
      ]}
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
          style={[
            styles.checkbox,
            isActive && !showsDone && styles.checkboxActive,
            isDone && styles.checkboxDone,
            completing && styles.checkboxCompleting,
            squareStyle,
          ]}>
          {showsDone && <Check size={14} color={colors.bgBase} strokeWidth={3} />}
          {isActive && !showsDone && <View style={styles.checkboxActiveDot} />}
        </Animated.View>
      </Pressable>

      {/* Reserved even when empty, so every title starts on the same line. */}
      <View style={styles.taskIcon}>
        {task.icon && <DynamicIcon name={task.icon} size={18} color={colors.textSecondary} strokeWidth={1.75} />}
      </View>

      <View style={styles.content} importantForAccessibility="no-hide-descendants">
        {/* Two lines, not one: at a larger system font a long title used to
            be cut off with no way to read the rest short of opening it. */}
        <Text style={[styles.title, isDone && styles.titleCompleted]} numberOfLines={2}>
          {task.title}
        </Text>
        {/* Wraps instead of overflowing the card at large font sizes. */}
        <View style={styles.metaRow}>
          {isActive && !isEmbedded && (
            <>
              {/* Spelled out, not only tinted — the state can't rest on color alone. */}
              <Text style={styles.nowLabel}>Now</Text>
              <Text style={styles.metaDot}>·</Text>
            </>
          )}
          <CategoryBadge category={task.category} />
          <Text style={styles.metaDot}>·</Text>
          {/* The bell travels with the due label, so a wrapped line never
              leaves it alone on a row of its own. */}
          <View style={styles.dueGroup}>
            <DataText style={[styles.dueTime, isOverdue && styles.dueOverdue]}>{dueLabel}</DataText>
            {hasReminder && <Bell size={12} color={colors.textSecondary} strokeWidth={1.75} />}
          </View>
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
  rowEmbedded: {
    backgroundColor: 'transparent',
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
  // A finished task recedes: a quiet grey fill, not lime. Lime is for "act
  // here / now / today" (DESIGN.md §2), and a screen of finished tasks — the
  // Completed filter — should be the calmest one in the app.
  checkboxDone: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
  },
  // The one lime moment of finishing: the tick lands in the accent for the
  // beat before the row slides away.
  checkboxCompleting: {
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
    flexWrap: 'wrap',
    columnGap: spacing.xs,
    rowGap: spacing.xs / 2,
  },
  dueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
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
