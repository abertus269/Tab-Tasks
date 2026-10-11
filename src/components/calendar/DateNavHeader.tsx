import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  label: string;
  // What one step is — "day", "month" — so the arrows announce
  // "Previous month" rather than a bare, unlabeled chevron.
  unit: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavHeader({ label, unit, onPrev, onNext }: Props) {
  return (
    <View style={styles.row}>
      <IconButton icon={ChevronLeft} label={`Previous ${unit}`} onPress={onPrev} />
      <Text style={styles.label} numberOfLines={1} accessibilityRole="header">
        {label}
      </Text>
      <IconButton icon={ChevronRight} label={`Next ${unit}`} onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
});
