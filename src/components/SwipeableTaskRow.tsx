/* eslint-disable react-hooks/immutability, react-hooks/refs --
   The React Compiler rules in eslint-plugin-react-hooks don't know about
   Reanimated's SharedValue mutation contract or gesture-handler's builder
   API: `.value =` assignments and the ref read inside `.onStart()` below
   only ever run from gesture callbacks (UI thread / JS-thread event
   handlers), never during render, even though both are written inline in
   the render body as Reanimated/Gesture-Handler require. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TaskRow } from '@/components/TaskRow';
import { shouldDeleteOnRelease, swipeProgress } from '@/lib/swipe';
import type { RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  task: TaskWithCategory;
  onToggleComplete: () => void;
  onPress: () => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  registerExit: (taskId: string, trigger: (direction: 1 | -1) => void) => () => void;
}

const EXIT_DURATION = 180;
const COLLAPSE_DURATION = 140;
const EXIT_OVERSHOOT = 32;

// Wraps TaskRow with the drag-to-delete + long-press-to-menu gestures from
// SPEC.md §4/§10. Pan and long-press race each other (Gesture.Race): a
// horizontal drag past 12px activates pan before long-press's 350ms timer
// can fire, and holding still keeps the drag under long-press's 12px
// maxDistance, so they can never both activate. Neither steals a plain tap —
// TaskRow's own Pressables underneath only lose the touch once one of these
// gestures actually activates, so tapping the row or the checkbox is
// unaffected.
//
// `registerExit` lets a caller (TaskContextMenu's Delete button, via
// useTaskRowActions) replay this exact same slide-out + collapse animation
// on the specific row it targets, instead of the menu having its own
// separate delete path.
export function SwipeableTaskRow({ task, onToggleComplete, onPress, onDelete, onLongPress, registerExit }: Props) {
  const measureRef = useRef<View>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);
  const rowScaleHeight = useSharedValue(1);

  const finishDelete = useCallback(() => {
    onDelete(task);
  }, [onDelete, task]);

  const runExit = useCallback(
    (direction: 1 | -1) => {
      translateX.value = withTiming(
        direction * (rowWidth + EXIT_OVERSHOOT),
        { duration: EXIT_DURATION },
        (finished) => {
          if (!finished) return;
          rowOpacity.value = withTiming(0, { duration: COLLAPSE_DURATION });
          rowScaleHeight.value = withTiming(0, { duration: COLLAPSE_DURATION }, (done) => {
            if (done) runOnJS(finishDelete)();
          });
        },
      );
    },
    [translateX, rowWidth, rowOpacity, rowScaleHeight, finishDelete],
  );

  useEffect(() => registerExit(task.id, runExit), [registerExit, task.id, runExit]);

  const handleLongPress = useCallback(() => {
    measureRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(task, { x, y, width, height });
    });
  }, [task, onLongPress]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const goDelete = shouldDeleteOnRelease(e.translationX, e.velocityX, rowWidth);
      if (!goDelete) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
        return;
      }
      runOnJS(runExit)(e.translationX >= 0 ? 1 : -1);
    });

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .maxDistance(12)
    .onStart(() => {
      runOnJS(handleLongPress)();
    });

  const gesture = Gesture.Race(pan, longPress);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
    height: rowHeight === null ? undefined : rowHeight * rowScaleHeight.value,
    marginBottom: spacing.sm * rowScaleHeight.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: swipeProgress(translateX.value, rowWidth),
  }));

  return (
    <Animated.View
      style={containerStyle}
      onLayout={(e) => {
        if (rowHeight === null) setRowHeight(e.nativeEvent.layout.height);
      }}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Trash2 size={20} color={colors.bgBase} strokeWidth={2} />
        <Trash2 size={20} color={colors.bgBase} strokeWidth={2} />
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={rowStyle}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
          accessibilityActions={[{ name: 'edit' }, { name: 'delete' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'edit') onPress();
            if (e.nativeEvent.actionName === 'delete') runExit(1);
          }}>
          <View ref={measureRef} collapsable={false}>
            <TaskRow task={task} onToggleComplete={onToggleComplete} onPress={onPress} />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.danger,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
});
