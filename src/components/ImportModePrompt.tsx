import { format } from 'date-fns';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BackupFile } from '@/lib/backup';
import type { ImportMode } from '@/db/backup';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  backup: BackupFile | null;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
}

// Mirrors DeleteCategoryPrompt's shape: a destructive choice (Replace) is
// always explicit and never the default, matching this app's existing rule
// for category deletion (SPEC.md §2.2) applied to backup import.
export function ImportModePrompt({ backup, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();

  const taskCount = backup?.tasks.length ?? 0;
  const categoryCount = backup?.categories.length ?? 0;
  const exportedLabel = backup?.exportedAt ? format(new Date(backup.exportedAt), 'MMM d, yyyy') : '';

  return (
    <Modal visible={!!backup} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title}>Import backup?</Text>
          <Text style={styles.body}>
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'} · {categoryCount}{' '}
            {categoryCount === 1 ? 'category' : 'categories'}
            {exportedLabel ? ` · exported ${exportedLabel}` : ''}
          </Text>

          <Pressable onPress={() => onConfirm('merge')} style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>Merge with existing</Text>
          </Pressable>
          <Pressable onPress={() => onConfirm('replace')} style={styles.dangerButton}>
            <Text style={styles.dangerLabel}>Replace everything</Text>
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
