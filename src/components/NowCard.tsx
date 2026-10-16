import { StyleSheet, Text, View } from 'react-native';

import { DataText } from '@/components/DataText';
import { SwipeableTaskRow } from '@/components/SwipeableTaskRow';
import type { CompleteBehavior, RegisterRowExit, RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  tasks: TaskWithCategory[];
  completeBehavior: CompleteBehavior;
  onStatusPress: (task: TaskWithCategory) => void;
  onOpen: (task: TaskWithCategory) => void;
  onComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  onToggleNow: (task: TaskWithCategory) => void;
  registerExit: RegisterRowExit;
}

// DESIGN.md §6 — what you're doing right now, pinned above the dated list
// wherever its due date falls. The "Now" in lime is the card's one claim on
// the accent; the Today rule below it keeps the list's own landmark. The rows
// inside are flat (variant="embedded") — a card holding cards would be two
// surfaces for one idea.
export function NowCard({
  tasks,
  completeBehavior,
  onStatusPress,
  onOpen,
  onComplete,
  onDelete,
  onLongPress,
  onToggleNow,
  registerExit,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header} accessibilityRole="header">
        <Text style={styles.title}>Now</Text>
        {tasks.length > 1 && <DataText style={styles.count}>{String(tasks.length)}</DataText>}
      </View>
      {tasks.map((task) => (
        <SwipeableTaskRow
          key={task.id}
          task={task}
          variant="embedded"
          completeBehavior={completeBehavior}
          onStatusPress={() => onStatusPress(task)}
          onOpen={() => onOpen(task)}
          onComplete={onComplete}
          onDelete={onDelete}
          onLongPress={onLongPress}
          onToggleNow={onToggleNow}
          registerExit={registerExit}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgActive,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderActive,
    paddingTop: spacing.md,
    // Each swipeable row carries an 8dp bottom margin of its own (it's what
    // spaces rows in a list), so the card only adds the difference.
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSize.body,
    color: colors.accentPrimary,
  },
  count: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
