import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavHeader({ label, onPrev, onNext }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} hitSlop={12} style={styles.arrow}>
        <ChevronLeft size={22} color={colors.textSecondary} strokeWidth={1.75} />
      </Pressable>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Pressable onPress={onNext} hitSlop={12} style={styles.arrow}>
        <ChevronRight size={22} color={colors.textSecondary} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  arrow: {
    padding: spacing.xs,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
});
