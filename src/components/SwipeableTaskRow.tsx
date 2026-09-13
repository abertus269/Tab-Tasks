/* eslint-disable react-hooks/immutability, react-hooks/refs --
   The React Compiler rules in eslint-plugin-react-hooks don't know about
   Reanimated's SharedValue mutation contract or gesture-handler's builder
   API: `.value =` assignments and the ref read inside `.onStart()` below
   only ever run from gesture callbacks (UI thread / JS-thread event
   handlers), never during render, even though both are written inline in
   the render body as Reanimated/Gesture-Handler require. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { TaskRow } from '@/components/TaskRow';
import { shouldCompleteOnRelease, swipeProgress } from '@/lib/swipe';
import type { CompleteBehavior, ExitReason, RegisterRowExit, RowAnchor, TaskWithCategory } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

interface Props {
  task: TaskWithCategory;
  // 'exit' (Tasks tab): a completed swipe/tap slides the row out and
  // collapses it before the status write lands — done tasks don't stay in
  // that list. 'toggle' (Calendar Day/Week): a completed swipe flips the
  // status in place and springs back — done tasks stay visible there.
  completeBehavior: CompleteBehavior;
  onPress: () => void;
  onComplete: (task: TaskWithCategory) => void;
  onDelete: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory, anchor: RowAnchor) => void;
  registerExit: RegisterRowExit;
}

const EXIT_DURATION = 180;
const COLLAPSE_DURATION = 140;
const EXIT_OVERSHOOT = 32;

// Wraps TaskRow with the drag-to-complete + long-press-to-menu gestures from
// SPEC.md §4/§10. Pan and long-press race each other (Gesture.Race): a
// horizontal drag past 12px activates pan before long-press's 350ms timer
// can fire, and holding still keeps the drag under long-press's 12px
// maxDistance, so they can never both activate. Neither steals a plain tap —
// TaskRow's own Pressable underneath only loses the touch once one of these
// gestures actually activates, so tapping the row (which cycles its status)
// is unaffected.
//
// A completed swipe marks the task done (or undoes it back to todo if it was
// already done — swipe is a direct toggle, independent of the tap-cycle
// setting). What happens to the row after depends on `completeBehavior`:
// in 'toggle' mode it springs back to rest and stays, struck through; in
// 'exit' mode it plays the same slide-out + collapse animation as a delete
// (see `runExit`) before the status write lands, since the Tasks tab hides
// done tasks behind the Completed filter. Deleting always plays that same
// exit animation regardless of mode — it's long-press → Delete only, and
// `registerExit` lets that button (or a tap that crosses the done boundary
// in 'exit' mode, via useTaskRowActions) replay it on this specific row.
export function SwipeableTaskRow({
  task,
  completeBehavior,
  onPress,
  onComplete,
  onDelete,
  onLongPress,
  registerExit,
}: Props) {
  const measureRef = useRef<View>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);
  const rowScaleHeight = useSharedValue(1);
  // Guards against a second exit trigger (e.g. an accessibility action, or a
  // tap-to-complete racing a long-press Delete) restarting the animation or
  // firing finishExit twice mid-flight.
  const exiting = useSharedValue(false);

  const finishExit = useCallback(
    (reason: ExitReason) => {
      if (reason === 'delete') onDelete(task);
      else onComplete(task);
    },
    [onDelete, onComplete, task],
  );

  const runExit = useCallback(
    (direction: 1 | -1, reason: ExitReason) => {
      if (exiting.value) return;
      exiting.value = true;
      translateX.value = withTiming(
        direction * (rowWidth + EXIT_OVERSHOOT),
        { duration: EXIT_DURATION },
        (finished) => {
          if (!finished) return;
          rowOpacity.value = withTiming(0, { duration: COLLAPSE_DURATION });
          rowScaleHeight.value = withTiming(0, { duration: COLLAPSE_DURATION }, (done) => {
            if (done) runOnJS(finishExit)(reason);
          });
        },
      );
    },
    [exiting, translateX, rowWidth, rowOpacity, rowScaleHeight, finishExit],
  );

  useEffect(() => registerExit(task.id, runExit), [registerExit, task.id, runExit]);

  const handleLongPress = useCallback(() => {
    measureRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(task, { x, y, width, height });
    });
  }, [task, onLongPress]);

  const handleComplete = useCallback(() => {
    onComplete(task);
  }, [task, onComplete]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const completing = shouldCompleteOnRelease(e.translationX, e.velocityX, rowWidth);
      if (completing && completeBehavior === 'exit') {
        // Let the row keep sliding in the direction it was already being
        // dragged, straight into the exit animation, instead of snapping
        // back to rest first.
        runOnJS(runExit)(e.translationX >= 0 ? 1 : -1, 'complete');
        return;
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
      if (completing) {
        runOnJS(handleComplete)();
      }
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

  // Only the icon under the uncovered edge shows — dragging right reveals
  // the row's left edge (left icon), dragging left reveals the right edge
  // (right icon). Both used to fade in together regardless of direction.
  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));
  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  return (
    <Animated.View
      style={containerStyle}
      onLayout={(e) => {
        if (rowHeight === null) setRowHeight(e.nativeEvent.layout.height);
      }}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={leftIconStyle}>
          <Check size={20} color={colors.bgBase} strokeWidth={2.5} />
        </Animated.View>
        <Animated.View style={rightIconStyle}>
          <Check size={20} color={colors.bgBase} strokeWidth={2.5} />
        </Animated.View>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={rowStyle}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
          accessibilityActions={[
            { name: 'activate', label: 'Cycle status' },
            { name: 'complete', label: task.status === 'done' ? 'Mark not done' : 'Mark done' },
            { name: 'delete', label: 'Delete' },
          ]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'activate') onPress();
            if (e.nativeEvent.actionName === 'complete') {
              if (completeBehavior === 'exit') runExit(1, 'complete');
              else onComplete(task);
            }
            if (e.nativeEvent.actionName === 'delete') runExit(1, 'delete');
          }}>
          <View ref={measureRef} collapsable={false}>
            <TaskRow task={task} onPress={onPress} />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
});
