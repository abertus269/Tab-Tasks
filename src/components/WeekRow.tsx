import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DataText } from '@/components/DataText';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  rangeLabel: string;
  taskCount: number;
  isCurrentWeek: boolean;
  onPress: () => void;
}

// Modeled on YearRow.tsx (label + count badge + trailing chevron, same
// Pressable card), sized down from `display` to `heading` — a date-range
// string runs longer than a 4-digit year. `isCurrentWeek` mirrors the
// "today" accent treatment used elsewhere (MonthGrid's today circle,
// WeekDetailView's day headers).
export function WeekRow({ rangeLabel, taskCount, isCurrentWeek, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${rangeLabel}${isCurrentWeek ? ', this week' : ''}, ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`}
      android_ripple={{ color: colors.borderSubtle }}>
      <Text style={[styles.range, isCurrentWeek && styles.rangeCurrent]} numberOfLines={1}>
        {rangeLabel}
      </Text>
      <View style={styles.countBadge}>
        <DataText style={[styles.countText, taskCount === 0 && styles.countEmpty]}>
          {taskCount === 0 ? 'No tasks' : `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`}
        </DataText>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.75} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    gap: spacing.md,
  },
  range: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  rangeCurrent: {
    color: colors.accentPrimary,
  },
  countBadge: {
    flex: 1,
  },
  countText: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  // An empty bucket recedes, so the weeks and years that hold work stand out.
  countEmpty: {
    color: colors.textMuted,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
