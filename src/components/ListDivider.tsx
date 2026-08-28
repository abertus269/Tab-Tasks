import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  kind: 'today' | 'upcoming';
}

// DESIGN.md §6 — a thin rule spanning the list width with a small centered
// label. "Today" keeps the original lime treatment (the dominant marker in
// the list); "Upcoming" is quieter (border-subtle/text-secondary) so it
// reads as secondary structure, not a second "today".
export function ListDivider({ kind }: Props) {
  const isToday = kind === 'today';
  return (
    <View style={styles.container}>
      <View style={[styles.line, isToday ? styles.lineToday : styles.lineUpcoming]} />
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
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
  },
  lineToday: {
    backgroundColor: colors.accentPrimary,
    opacity: 0.35,
  },
  lineUpcoming: {
    backgroundColor: colors.borderSubtle,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    letterSpacing: 0.5,
  },
  labelToday: {
    color: colors.accentPrimary,
  },
  labelUpcoming: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  emptyLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});
