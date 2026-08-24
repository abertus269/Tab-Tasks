import { Pencil, Trash2 } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  taskTitle: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Row overflow menu (Edit / Delete) — SPEC.md §4 allows swipe-to-delete *or*
// a row menu; the menu ships first for a reliable MVP, swipe layered on later.
export function RowActionsSheet({ visible, taskTitle, onClose, onEdit, onDelete }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title} numberOfLines={1}>
            {taskTitle}
          </Text>

          <Pressable style={styles.action} onPress={onEdit} hitSlop={4}>
            <Pencil size={18} color={colors.textPrimary} strokeWidth={1.75} />
            <Text style={styles.actionLabel}>Edit</Text>
          </Pressable>

          <Pressable style={styles.action} onPress={onDelete} hitSlop={4}>
            <Trash2 size={18} color={colors.danger} strokeWidth={1.75} />
            <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  deleteLabel: {
    color: colors.danger,
  },
});
