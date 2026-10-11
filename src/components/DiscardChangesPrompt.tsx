import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

// Shown when the task form is closed (X or hardware Back) with unsaved
// edits. Same bottom-sheet shape as DeleteCategoryPrompt; the safe option —
// keep editing — is the visually primary one, and dismissing the sheet any
// other way (backdrop tap, Back) also keeps editing.
export function DiscardChangesPrompt({ visible, onKeepEditing, onDiscard }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <Pressable style={styles.backdrop} onPress={onKeepEditing}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title} accessibilityRole="header">
            Discard changes?
          </Text>
          <Text style={styles.body}>Your edits to this task haven&apos;t been saved.</Text>

          <Pressable onPress={onKeepEditing} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryLabel}>Keep editing</Text>
          </Pressable>
          <Pressable onPress={onDiscard} style={styles.dangerButton} accessibilityRole="button">
            <Text style={styles.dangerLabel}>Discard</Text>
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
    minHeight: 48,
    justifyContent: 'center',
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
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.danger,
  },
});
