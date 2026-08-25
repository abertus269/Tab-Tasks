import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  onUndo: () => void;
}

// Purely presentational — the 5s auto-dismiss timer lives in
// useTaskRowActions alongside the deleted-task snapshot it's undoing.
export function UndoToast({ visible, onUndo }: Props) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(150)} style={styles.toast}>
      <Text style={styles.message}>Task deleted</Text>
      <Pressable onPress={onUndo} hitSlop={8}>
        <Text style={styles.undo}>Undo</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSurfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  undo: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.accentPrimary,
  },
});
