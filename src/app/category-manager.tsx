import { useRouter } from 'expo-router';
import { Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryEditSheet } from '@/components/CategoryEditSheet';
import { DeleteCategoryPrompt } from '@/components/DeleteCategoryPrompt';
import { DynamicIcon } from '@/components/DynamicIcon';
import { useCategories } from '@/hooks/useCategories';
import type { CategoryRecord } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

type EditTarget = CategoryRecord | 'new' | null;

// SPEC.md §2.2 — full CRUD: create, rename, recolor, re-icon, delete.
export default function CategoryManagerScreen() {
  const router = useRouter();
  const categories = useCategories();
  const [editing, setEditing] = useState<EditTarget>(null);
  const [deleting, setDeleting] = useState<CategoryRecord | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Categories</Text>
        <Pressable onPress={() => setEditing('new')} hitSlop={8}>
          <Plus size={22} color={colors.accentPrimary} strokeWidth={2.5} />
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          return (
            <View style={styles.row}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]}>
                {item.icon && <DynamicIcon name={item.icon} size={16} color={colors.bgBase} strokeWidth={2} />}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable onPress={() => setEditing(item)} hitSlop={8} style={styles.iconAction}>
                <Pencil size={16} color={colors.textSecondary} strokeWidth={1.75} />
              </Pressable>
              <Pressable onPress={() => setDeleting(item)} hitSlop={8} style={styles.iconAction}>
                <Trash2 size={16} color={colors.danger} strokeWidth={1.75} />
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No categories yet.</Text>}
      />

      <CategoryEditSheet
        visible={editing !== null}
        category={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />

      <DeleteCategoryPrompt category={deleting} onClose={() => setDeleting(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  iconAction: {
    padding: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingTop: spacing.xxl,
  },
});
