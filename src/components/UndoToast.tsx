import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  message: string;
  onUndo: () => void;
}

// Purely presentational — the 5s auto-dismiss timer and the message text
// (what's actually being undone: a delete or a status change) live in
// useTaskRowActions / src/lib/undo.ts alongside the pending snapshot.
export function UndoToast({ visible, message, onUndo }: Props) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(150)}
      style={styles.toast}
      // Announces "Task deleted" etc. the moment it appears — the toast is
      // otherwise invisible to TalkBack until focus happens to land on it.
      accessibilityLiveRegion="polite">
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onUndo} style={styles.undoTarget} accessibilityRole="button">
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
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  undoTarget: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
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
