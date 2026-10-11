import { Pressable, StyleSheet, Text } from 'react-native';

import { DynamicIcon } from '@/components/DynamicIcon';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  label: string;
  color?: string;
  icon?: string | null;
  selected: boolean;
  onPress: () => void;
}

// DESIGN.md §6 — rounded-full pill. Unselected: border-subtle outline,
// text-secondary label. Selected: solid fill in the category's (or
// accent-primary's) color, dark text for contrast.
export function FilterPill({ label, color, icon, selected, onPress }: Props) {
  const fill = selected ? (color ?? colors.accentPrimary) : 'transparent';
  const textColor = selected ? colors.bgBase : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      // 36dp pill + 6dp above and below = 48dp. Horizontal slop stays inside
      // the 8dp gap between neighbors so adjacent chips' targets never overlap.
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.pill, { backgroundColor: fill, borderColor: selected ? fill : colors.borderSubtle }]}>
      {icon && <DynamicIcon name={icon} size={14} color={textColor} strokeWidth={2} />}
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
  },
});
