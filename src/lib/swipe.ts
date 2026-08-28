// SPEC.md §4/§10 — swipe-to-complete thresholds. Pulled out of
// SwipeableTaskRow so the release decision is unit-testable and so the same
// pure math can run as a Reanimated worklet on the UI thread without pulling
// gesture-handler types into a test file.
export const SWIPE_COMPLETE_RATIO = 0.4; // fraction of row width to count as a full swipe
export const SWIPE_FLICK_VELOCITY = 800; // px/s — a fast flick short-circuits the distance threshold
export const SWIPE_FLICK_RATIO = 0.2; // minimum travel for a flick to still count

// Both directions complete — there's no separate meaning for left vs. right,
// so the row bounces back below the ratio and toggles done past it either way.
export function shouldCompleteOnRelease(translationX: number, velocityX: number, rowWidth: number): boolean {
  'worklet';
  if (rowWidth <= 0) return false;

  const absTranslation = Math.abs(translationX);
  if (absTranslation >= rowWidth * SWIPE_COMPLETE_RATIO) return true;

  const isFlick = Math.abs(velocityX) >= SWIPE_FLICK_VELOCITY;
  const sameDirection = translationX !== 0 && Math.sign(velocityX) === Math.sign(translationX);
  const traveledEnough = absTranslation >= rowWidth * SWIPE_FLICK_RATIO;
  return isFlick && sameDirection && traveledEnough;
}

// 0..1 — how "committed" a drag is, used to fade in the green complete backdrop.
export function swipeProgress(translationX: number, rowWidth: number): number {
  'worklet';
  if (rowWidth <= 0) return 0;
  return Math.min(Math.abs(translationX) / (rowWidth * SWIPE_COMPLETE_RATIO), 1);
}
