import { StyleSheet, Text, View } from 'react-native';

import { DynamicIcon } from '@/components/DynamicIcon';
import type { CategoryRecord } from '@/lib/types';
import { colors, iconSize, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  category: CategoryRecord | null;
}

// DESIGN.md §5 — colored dot or filled rounded-square badge + Lucide glyph + name.
export function CategoryBadge({ category }: Props) {
  const color = category?.color ?? colors.borderSubtle;
  const label = category?.name ?? 'Uncategorized';

  return (
    <View style={styles.container}>
      {category?.icon ? (
        <View style={[styles.iconBadge, { backgroundColor: color }]}>
          <DynamicIcon name={category.icon} size={iconSize.inline - 4} color={colors.bgBase} strokeWidth={2} />
        </View>
      ) : (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconBadge: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    maxWidth: 110,
  },
});
