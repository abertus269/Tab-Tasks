import { useRouter } from 'expo-router';
import { Plus, Settings2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryEditSheet } from '@/components/CategoryEditSheet';
import { FilterPill } from '@/components/FilterPill';
import { useCategories } from '@/hooks/useCategories';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

// DESIGN.md §6 — category selection reuses the filter-pill component plus a
// trailing "+ Add category" pill. Full category CRUD (rename/recolor/re-icon/
// delete) lives one level deeper, behind the settings glyph, per SPEC.md §2.2.
export function CategoryPicker({ selectedCategoryId, onSelect }: Props) {
  const categories = useCategories();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Category</Text>
        <Pressable onPress={() => router.push('/category-manager')} hitSlop={8}>
          <Settings2 size={16} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <FilterPill label="Uncategorized" selected={selectedCategoryId === null} onPress={() => onSelect(null)} />
        {categories.map((c) => (
          <FilterPill
            key={c.id}
            label={c.name}
            color={c.color}
            icon={c.icon}
            selected={selectedCategoryId === c.id}
            onPress={() => onSelect(c.id)}
          />
        ))}
        <Pressable onPress={() => setCreating(true)} style={styles.addPill}>
          <Plus size={14} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.addLabel}>Add category</Text>
        </Pressable>
      </ScrollView>

      <CategoryEditSheet
        visible={creating}
        category={null}
        onClose={() => setCreating(false)}
        onSaved={(id) => {
          setCreating(false);
          onSelect(id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  row: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
  },
  addLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
