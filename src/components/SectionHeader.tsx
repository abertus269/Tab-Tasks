import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  dayName: string; // e.g. "Monday"
  dateLabel: string; // e.g. "July 21"
}

// DESIGN.md §6 — large day name (heading font) + date subtext (text-secondary).
export function SectionHeader({ dayName, dateLabel }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.dayName}>{dayName}</Text>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  dayName: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  dateLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
