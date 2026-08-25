import { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { TaskRow } from '@/components/TaskRow';
import type { RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  task: TaskWithCategory | null;
  anchor: RowAnchor | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CARD_GAP = 8;
// Two action rows + divider — used only to decide whether the card opens
// above or below the anchor before the card itself has been measured.
const CARD_HEIGHT_ESTIMATE = 104;

// Replaces the old bottom-sheet RowActionsSheet: a long-pressed row lifts
// slightly against a dimmed backdrop, and the Edit/Delete card floats
// anchored to that specific row (src/lib/types.ts RowAnchor, captured via
// measureInWindow in SwipeableTaskRow) instead of docking at the bottom of
// the screen. Modal stays mounted with visible={!!anchor} — same pattern as
// DeleteCategoryPrompt — so the fade-out plays instead of the content just
// vanishing when the menu closes.
export function TaskContextMenu({ task, anchor, onClose, onEdit, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (anchor) {
      scale.value = 1;
      scale.value = withSpring(1.02, { damping: 16, stiffness: 200 });
    }
  }, [anchor, scale]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const safeAnchor = anchor ?? { x: 0, y: 0, width: 0, height: 0 };
  const windowHeight = Dimensions.get('window').height;
  const opensBelow =
    safeAnchor.y + safeAnchor.height + CARD_GAP + CARD_HEIGHT_ESTIMATE <= windowHeight - insets.bottom;

  return (
    <Modal visible={!!anchor} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {task && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.liftedRow,
              { top: safeAnchor.y, left: safeAnchor.x, width: safeAnchor.width },
              rowStyle,
            ]}>
            <TaskRow task={task} onToggleComplete={() => {}} onPress={() => {}} />
          </Animated.View>
        )}

        <View
          style={[
            styles.menu,
            { left: safeAnchor.x, width: safeAnchor.width },
            opensBelow
              ? { top: safeAnchor.y + safeAnchor.height + CARD_GAP }
              : { top: safeAnchor.y - CARD_GAP - CARD_HEIGHT_ESTIMATE },
          ]}>
          <Pressable style={styles.action} onPress={onEdit} hitSlop={4}>
            <Pencil size={18} color={colors.textPrimary} strokeWidth={1.75} />
            <Text style={styles.actionLabel}>Edit</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.action} onPress={onDelete} hitSlop={4}>
            <Trash2 size={18} color={colors.danger} strokeWidth={1.75} />
            <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  liftedRow: {
    position: 'absolute',
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.bgSurfaceRaised,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  deleteLabel: {
    color: colors.danger,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
  },
});
