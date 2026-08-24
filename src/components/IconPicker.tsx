import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/components/DynamicIcon';
import { ICON_NAMES } from '@/lib/icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  selected: string | null;
  onSelect: (icon: string | null) => void;
  onClose: () => void;
}

// SPEC.md §6 "Icon (Lucide picker)" / DESIGN.md §5 — a searchable grid over
// the curated subset in lib/icons.ts, not the full ~1,600-icon library.
export function IconPicker({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(
    () => ICON_NAMES.filter((name) => name.includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose an icon</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textSecondary} strokeWidth={1.75} />
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search icons"
            placeholderTextColor={colors.textMuted}
            style={styles.search}
          />

          <FlatList
            data={filtered}
            numColumns={5}
            keyExtractor={(name) => name}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  onPress={() => onSelect(isSelected ? null : item)}
                  style={[styles.cell, isSelected && styles.cellSelected]}>
                  <DynamicIcon
                    name={item}
                    size={24}
                    color={isSelected ? colors.bgBase : colors.textPrimary}
                    strokeWidth={1.75}
                  />
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 56;

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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  search: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.sm,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs / 2,
  },
  cellSelected: {
    backgroundColor: colors.accentPrimary,
  },
});
