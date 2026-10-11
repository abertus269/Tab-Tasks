import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  kind: 'today' | 'upcoming';
}

// DESIGN.md §6 — the list's one landmark. "Today" is the app's anchor point
// (PRODUCT.md: today first), so it reads at full strength: a solid lime
// rule with the label left-aligned like a section heading, where a scanning
// eye starts. It used to be a centered mono word on a 35%-opacity rule that
// barely registered. "Upcoming" keeps the same shape, quieter, so it reads
// as secondary structure, not a second "today".
export function ListDivider({ kind }: Props) {
  const isToday = kind === 'today';
  return (
    <View style={styles.container} accessibilityRole="header">
      <Text style={[styles.label, isToday ? styles.labelToday : styles.labelUpcoming]}>
        {isToday ? 'Today' : 'Upcoming'}
      </Text>
      <View style={[styles.line, isToday ? styles.lineToday : styles.lineUpcoming]} />
    </View>
  );
}

// SPEC.md "Add tasks Not for Today" — sits between the Today and Upcoming
// dividers when nothing is due today, so a future task can never read as
// today's just because it's the next row after "Today".
export function EmptyTodayRow() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyLabel}>Nothing due today</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  line: {
    flex: 1,
  },
  lineToday: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accentPrimary,
  },
  lineUpcoming: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  label: {
    fontFamily: fonts.headingSemiBold,
  },
  labelToday: {
    fontSize: fontSize.body + 2,
    color: colors.accentPrimary,
  },
  labelUpcoming: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  emptyLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});
