import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, iconSize, minTouchTarget, strokeWidth as defaultStrokeWidth } from '@/theme/tokens';

interface Props {
  icon: LucideIcon;
  // Required — an icon-only control has no other text for TalkBack to read.
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  strokeWidth?: number;
  disabled?: boolean;
}

// Every icon-only control (header close/save/add, row edit/delete) goes
// through here so none can ship under 48dp or without a label. The glyph
// stays its visual size; the Pressable around it is the full 48×48.
export function IconButton({
  icon: Icon,
  label,
  onPress,
  color = colors.textSecondary,
  size = iconSize.nav,
  strokeWidth = defaultStrokeWidth,
  disabled = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={{ color: colors.borderSubtle, borderless: true, radius: minTouchTarget / 2 }}
      style={styles.target}>
      <Icon size={size} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
