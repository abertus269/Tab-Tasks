import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

export type CalendarMode = 'day' | 'week' | 'month' | 'year';

const OPTIONS: { mode: CalendarMode; label: string }[] = [
  { mode: 'day', label: 'Day' },
  { mode: 'week', label: 'Week' },
  { mode: 'month', label: 'Month' },
  { mode: 'year', label: 'Year' },
];

interface Props {
  mode: CalendarMode;
  onChange: (mode: CalendarMode) => void;
}

// DESIGN.md §7 — lives directly under the Calendar tab's header, not as a
// third layer of bottom navigation.
export function SegmentedControl({ mode, onChange }: Props) {
  return (
    <View style={styles.track}>
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => onChange(option.mode)}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.pill,
    padding: 3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.accentPrimary,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.bgBase,
  },
});
