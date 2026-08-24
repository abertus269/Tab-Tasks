import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteCategory, type CategoryDeleteMode } from '@/db/mutations';
import type { CategoryRecord } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  category: CategoryRecord | null;
  onClose: () => void;
}

// SPEC.md §2.2 — deleting a category always prompts: reassign its tasks to
// Uncategorized (the default, so it's the visually primary option) or delete
// them too. Never a silent delete.
export function DeleteCategoryPrompt({ category, onClose }: Props) {
  const insets = useSafeAreaInsets();

  async function handleConfirm(mode: CategoryDeleteMode) {
    if (category) {
      await deleteCategory(category.id, mode);
    }
    onClose();
  }

  return (
    <Modal visible={!!category} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title}>{`Delete "${category?.name}"?`}</Text>
          <Text style={styles.body}>
            Its tasks can be moved to Uncategorized, or deleted along with the category.
          </Text>

          <Pressable onPress={() => handleConfirm('reassign')} style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>Move tasks to Uncategorized</Text>
          </Pressable>
          <Pressable onPress={() => handleConfirm('deleteTasks')} style={styles.dangerButton}>
            <Text style={styles.dangerLabel}>Delete category and its tasks</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgSurfaceRaised,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.bgBase,
  },
  dangerButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.danger,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
