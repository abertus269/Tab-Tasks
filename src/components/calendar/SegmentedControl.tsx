import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
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
    <View style={styles.track} accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => onChange(option.mode)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
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
    padding: spacing.xs / 2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    // A full 48dp touch target; the track's 2dp padding sits outside it.
    minHeight: minTouchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Neutral-inverse, not lime: the selected mode is a state of the view, and
  // lime is kept for "act here / now / today" (DESIGN.md §2).
  segmentSelected: {
    backgroundColor: colors.textPrimary,
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
