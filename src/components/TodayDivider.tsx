import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

// DESIGN.md §6 — a thin rule spanning the list width with a small centered
// "Today" label in accent-primary.
export function TodayDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>Today</Text>
      <View style={styles.line} />
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
    backgroundColor: colors.accentPrimary,
    opacity: 0.35,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.accentPrimary,
    letterSpacing: 0.5,
  },
});
