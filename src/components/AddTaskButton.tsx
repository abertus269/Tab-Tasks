import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  onPress: () => void;
}

// DESIGN.md §6 — inline button at the bottom of the list, not a FAB, so it
// doesn't compete with the two-tab bar.
export function AddTaskButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Plus size={20} color={colors.bgBase} strokeWidth={2.5} />
      <Text style={styles.label}>Add task</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.bgBase,
  },
});
