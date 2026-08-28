import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  onPress: () => void;
}

// DESIGN.md §6 — inline button at the bottom of the list, not a FAB, so it
// doesn't compete with the two-tab bar. Self-sized and centered rather than
// full-bleed — a full-width lime slab read as too dominant against the
// task rows above it (SPEC.md "Add tasks Too Big").
export function AddTaskButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Plus size={16} color={colors.bgBase} strokeWidth={2.5} />
      <Text style={styles.label}>Add task</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.bgBase,
  },
});
