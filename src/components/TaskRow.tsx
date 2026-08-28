import { Bell, Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryBadge } from '@/components/CategoryBadge';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatDueDateShort, formatTime12h } from '@/lib/dates';
import type { TaskWithCategory } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  task: TaskWithCategory;
  onPress: () => void;
}

// Tapping the row cycles its status (src/lib/status.ts, src/hooks/useTaskRowActions.ts);
// editing now lives behind long-press -> the Edit/Delete context menu. The
// checkbox is a status indicator, not its own tap target.
export function TaskRow({ task, onPress }: Props) {
  // Always show the due date, not just the time — this list merges every
  // date together, and a row's position relative to the today-divider isn't
  // enough on its own to tell a future task from one due today.
  const dueLabel = task.dueTime
    ? `${formatDueDateShort(task.dueDate)} · ${formatTime12h(task.dueTime)}`
    : formatDueDateShort(task.dueDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      android_ripple={{ color: colors.borderSubtle }}>
      <View
        style={[
          styles.checkbox,
          task.status === 'active' && styles.checkboxActive,
          task.status === 'done' && styles.checkboxChecked,
        ]}>
        {task.status === 'done' && <Check size={14} color={colors.bgBase} strokeWidth={3} />}
        {task.status === 'active' && <View style={styles.checkboxActiveDot} />}
      </View>

      {task.icon && (
        <View style={styles.taskIcon}>
          <DynamicIcon name={task.icon} size={18} color={colors.textSecondary} strokeWidth={1.75} />
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={[styles.title, task.status === 'done' && styles.titleCompleted]}
          numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <CategoryBadge category={task.category} />
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.dueTime}>{dueLabel}</Text>
          {task.reminderMinutesBefore !== null && (
            <Bell size={12} color={colors.textSecondary} strokeWidth={1.75} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
  },
  rowPressed: {
    backgroundColor: colors.bgSurfaceRaised,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs / 2,
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
    color: colors.textSecondary,
    fontSize: fontSize.caption,
  },
  dueTime: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
