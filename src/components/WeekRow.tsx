import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.range, isCurrentWeek && styles.rangeCurrent]} numberOfLines={1}>
        {rangeLabel}
      </Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </Text>
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
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
