import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  year: string;
  taskCount: number;
  onPress: () => void;
}

// DESIGN.md §6 — large year number (heading font) + small task-count badge +
// trailing chevron; structurally identical to a day row, reused one level up.
export function YearRow({ year, taskCount, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.year}>{year}</Text>
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
  year: {
    fontFamily: fonts.heading,
    fontSize: fontSize.display,
    color: colors.textPrimary,
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
