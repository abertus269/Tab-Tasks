import { X } from 'lucide-react-native';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/components/DynamicIcon';
import { buildPickerItems, searchIconGroups, type PickerItem } from '@/lib/icons';
import { colors, iconSize, radius, spacing, strokeWidth } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  visible: boolean;
  selected: string | null;
  onSelect: (icon: string | null) => void;
  onClose: () => void;
}

const COLUMNS = 5;
const CELL_SIZE = 56;
const CELL_GAP = spacing.sm; // 8
const ROW_HEIGHT = CELL_SIZE + CELL_GAP; // 64
const HEADER_HEIGHT = 36;

// SPEC.md §6 "Icon (Lucide picker)" / DESIGN.md §5 — a searchable, sectioned
// grid over the curated ~100-icon set in lib/icons.ts, not the full
// ~3,500-icon library. `numColumns` can't interleave section headers between
// rows of cells, so the grid is a single flat FlatList fed a mix of header
// and row items (src/lib/icons.ts's buildPickerItems) with fixed heights —
// that's what makes getItemLayout (and therefore cheap scrolling to any
// point in ~100 icons) possible.
export function IconPicker({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const groups = useMemo(() => searchIconGroups(query), [query]);
  const items = useMemo(() => buildPickerItems(groups, COLUMNS), [groups]);

  // Prefix-sum offsets so FlatList never has to measure a cell to know where
  // it starts — required for getItemLayout, and what keeps ~100 icons cheap
  // to scroll through even before they've rendered.
  const layout = useMemo(() => {
    const result: { length: number; offset: number }[] = [];
    let offset = 0;
    for (const item of items) {
      const length = item.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT;
      result.push({ length, offset });
      offset += length;
    }
    return result;
  }, [items]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<PickerItem> | null | undefined, index: number) => ({ ...layout[index], index }),
    [layout],
  );

  const handleSelect = useCallback(
    (icon: string | null) => {
      setQuery('');
      onSelect(icon);
    },
    [onSelect],
  );

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const renderItem = useCallback(
    ({ item }: { item: PickerItem }) =>
      item.type === 'header' ? (
        <GroupHeader label={item.label} />
      ) : (
        <IconRow icons={item.icons} selected={selected} onSelect={handleSelect} />
      ),
    [selected, handleSelect],
  );

  const keyExtractor = useCallback((item: PickerItem) => item.key, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose an icon</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
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
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={10}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={40}
            windowSize={5}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.grid}
            ListEmptyComponent={<Text style={styles.empty}>No icons match.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

const GroupHeader = memo(function GroupHeader({ label }: { label: string }) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerLabel}>{label}</Text>
    </View>
  );
});

interface IconCellProps {
  name: string;
  selected: boolean;
  onSelect: (icon: string | null) => void;
}

const IconCell = memo(function IconCell({ name, selected, onSelect }: IconCellProps) {
  return (
    <Pressable
      onPress={() => onSelect(selected ? null : name)}
      style={[styles.cell, selected && styles.cellSelected]}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}>
      <DynamicIcon
        name={name}
        size={iconSize.picker}
        color={selected ? colors.bgBase : colors.textPrimary}
        strokeWidth={strokeWidth}
      />
    </Pressable>
  );
});

interface IconRowProps {
  icons: string[];
  selected: string | null;
  onSelect: (icon: string | null) => void;
}

const IconRow = memo(function IconRow({ icons, selected, onSelect }: IconRowProps) {
  return (
    <View style={styles.row}>
      {icons.map((name) => (
        <IconCell key={name} name={name} selected={name === selected} onSelect={onSelect} />
      ))}
    </View>
  );
});

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
    paddingBottom: spacing.sm,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  headerLabel: {
    fontFamily: fonts.headingSemiBold,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  row: {
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: colors.accentPrimary,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
