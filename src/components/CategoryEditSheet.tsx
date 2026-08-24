import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/components/DynamicIcon';
import { IconPicker } from '@/components/IconPicker';
import { createCategory, updateCategory } from '@/db/mutations';
import type { CategoryRecord } from '@/lib/types';
import { categoryColors, colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  category: CategoryRecord | null; // null = create mode
  onClose: () => void;
  onSaved: (id: string) => void;
}

// SPEC.md §2.2 — full CRUD: create, rename, recolor, re-icon. One form
// handles both create (from the task form's "+ Add category") and edit
// (from the category manager) so there's a single source of truth for it.
//
// The inner form only mounts while visible, so its useState reads straight
// from `category` at mount time — no effect needed to reset fields between
// a create and an edit, or between editing two different categories.
export function CategoryEditSheet({ visible, category, onClose, onSaved }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {visible && (
        <CategoryEditForm key={category?.id ?? 'new'} category={category} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}

interface FormProps {
  category: CategoryRecord | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}

function CategoryEditForm({ category, onClose, onSaved }: FormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? categoryColors[0]);
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const [error, setError] = useState<string | null>(null);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (category) {
        updateCategory(category.id, { name: trimmed, color, icon });
        onSaved(category.id);
      } else {
        const id = createCategory({ name: trimmed, color, icon });
        onSaved(id);
      }
    } catch {
      // SPEC.md §2.2 — category names must be unique.
      setError('A category with this name already exists.');
    }
  }

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.title}>{category ? 'Edit category' : 'New category'}</Text>

          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            placeholder="Category name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus={!category}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.swatchRow}>
            {categoryColors.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSelected]}
              />
            ))}
          </View>

          <Pressable onPress={() => setIconPickerVisible(true)} style={styles.iconButton}>
            {icon ? (
              <DynamicIcon name={icon} size={20} color={colors.textPrimary} strokeWidth={1.75} />
            ) : (
              <Text style={styles.iconButtonPlaceholder}>No icon</Text>
            )}
            <Text style={styles.iconButtonLabel}>Choose icon</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={!name.trim()}
            style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}>
            <Text style={styles.saveLabel}>{category ? 'Save' : 'Create'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>

      <IconPicker
        visible={iconPickerVisible}
        selected={icon}
        onSelect={(next) => {
          setIcon(next);
          setIconPickerVisible(false);
        }}
        onClose={() => setIconPickerVisible(false)}
      />
    </>
  );
}

const SWATCH_SIZE = 32;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgSurfaceRaised,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    marginTop: -spacing.sm,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.textPrimary,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    alignSelf: 'flex-start',
  },
  iconButtonPlaceholder: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  iconButtonLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.bgBase,
  },
});
